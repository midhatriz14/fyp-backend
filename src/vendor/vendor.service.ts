import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BusinessDetails, CateringBusinessDetails, PhotographerBusinessDetails, SalonBusinessDetails, User, VenueBusinessDetails } from '../auth/schemas/user.schema';
import { CreateContactDetailsDto } from './dto/create-contact-details.dto';
import { CreatePhotographerBusinessDetailsDto } from './dto/create-photographer-business-details.dto';
import { CreateSalonBusinessDetailsDto } from './dto/create-salon-business-details.dto';
import { CreateVenueBusinessDetailsDto } from './dto/create-venue-business-details.dto';
import { CreateCateringBusinessDetailsDto } from './dto/create-catering-business-details.dto';
import { CreatePackagesDto } from './dto/create-package.dto';
import { Category } from 'src/auth/schemas/category.schema';

interface VendorPackage {
    vendorId: string;
    packageName: string;
    price: number;
    services: string;  // consider changing to array for better matching
    maximumCapacity?: number;
}

export interface SmartPackageInput {
    eventName: string;
    eventDate: Date;
    guests: number;
    services: string[];  // services requested by user
}

@Injectable()
export class VendorService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
    ) { }

    async getAllVendorsByCategoryId(categoryId: string): Promise<User[]> {
        // Validate the categoryId
        if (!Types.ObjectId.isValid(categoryId)) {
            throw new Error('Invalid categoryId');
        }

        // Define the aggregation pipeline
        const pipeline = [
            {
                // Match vendors with the specified category and required fields
                $match: {
                    role: 'Vendor',
                    buisnessCategory: new Types.ObjectId(categoryId),
                    contactDetails: { $exists: true, $ne: null },
                    coverImage: { $exists: true, $ne: null },
                    packages: { $exists: true, $not: { $size: 0 } },
                    images: { $exists: true, $not: { $size: 0 } },
                    $or: [
                        { salonBusinessDetails: { $exists: true, $ne: null } },
                        { venueBusinessDetails: { $exists: true, $ne: null } },
                        { cateringBusinessDetails: { $exists: true, $ne: null } },
                        { photographerBusinessDetails: { $exists: true, $ne: null } }
                    ]
                }
            },
            {
                // Add the BusinessDetails field by checking which business detail exists
                $addFields: {
                    BusinessDetails: {
                        $cond: [
                            { $ifNull: ['$salonBusinessDetails', false] },
                            '$salonBusinessDetails',
                            {
                                $cond: [
                                    { $ifNull: ['$venueBusinessDetails', false] },
                                    '$venueBusinessDetails',
                                    {
                                        $cond: [
                                            { $ifNull: ['$cateringBusinessDetails', false] },
                                            '$cateringBusinessDetails',
                                            '$photographerBusinessDetails' // Assumes at least one exists
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                // Optionally, exclude the original separate business detail fields
                $project: {
                    salonBusinessDetails: 0,
                    venueBusinessDetails: 0,
                    cateringBusinessDetails: 0,
                    photographerBusinessDetails: 0
                }
            }
        ];

        // Execute the aggregation pipeline
        const vendors = await this.userModel.aggregate(pipeline).exec();

        return vendors as User[];
    }

    async createContactDetails(
        userId: string,
        createContactDetailsDto: CreateContactDetailsDto,
    ): Promise<User> {
        const user = await this.userModel.findById(userId).exec();
        if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

        user.contactDetails = { ...createContactDetailsDto }
        return await user.save();
    }

    async createBuisnessDetails(
        userId: string,
        dto:
            CreatePhotographerBusinessDetailsDto |
            CreateSalonBusinessDetailsDto |
            CreateVenueBusinessDetailsDto |
            CreateCateringBusinessDetailsDto,
    ): Promise<User> {
        const user = await this.userModel.findById(userId).populate('buisnessCategory').exec();
        if (!user) {
            throw new NotFoundException(`User not found or not defined yet.`);
        }
        const category = user.buisnessCategory as Category;
        if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
        if (category.name === "Venues") {
            user.venueBusinessDetails = { ...dto } as unknown as VenueBusinessDetails;
        } else if (category.name === "Caterings") {
            user.cateringBusinessDetails = { ...dto } as unknown as CateringBusinessDetails;
        } else if (category.name === "Photography") {
            user.photographerBusinessDetails = { ...dto } as PhotographerBusinessDetails;
        } else if (category.name === "Makeup") {
            user.salonBusinessDetails = { ...dto } as unknown as SalonBusinessDetails;
        } else {
            console.log("No Buisness Category", category);
            throw new NotFoundException(`Business Category not found or not defined yet.`);
        }
        return await user.save();
    }

    async addPackages(userId: string, createPackagesDto: CreatePackagesDto): Promise<User> {
        const user = await this.userModel.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        user.packages = createPackagesDto.packages; // Replace the current packages
        await user.save();
        return user;
    }

    async getContactDetails(userId: string) {
        const user = await this.userModel.findById(userId).select('contactDetails');
        if (!user) throw new NotFoundException('User not found');
        return user.contactDetails;
    }

    async getBusinessDetails(userId: string) {
        const user = await this.userModel.findById(userId).select(
            'salonBusinessDetails photographerBusinessDetails cateringBusinessDetails venueBusinessDetails',
        );

        if (!user) throw new NotFoundException('User not found');

        // Create an object with only non-null business details
        const businessDetails = {
            ...(user.salonBusinessDetails && { salonBusinessDetails: user.salonBusinessDetails }),
            ...(user.photographerBusinessDetails && { photographerBusinessDetails: user.photographerBusinessDetails }),
            ...(user.cateringBusinessDetails && { cateringBusinessDetails: user.cateringBusinessDetails }),
            ...(user.venueBusinessDetails && { venueBusinessDetails: user.venueBusinessDetails }),
        };

        return businessDetails;
    }

    async getPackages(userId: string) {
        const user = await this.userModel.findById(userId).select('packages');
        if (!user) throw new NotFoundException('User not found');
        return user.packages;
    }

    async getVendor(userId: string) {
        const user = await this.userModel.findById(userId).lean();
        const userObjToReturn = {
            ...user,
            BusinessDetails: user && user.photographerBusinessDetails
                ? user.photographerBusinessDetails :
                user?.cateringBusinessDetails ?
                    user.cateringBusinessDetails :
                    user?.venueBusinessDetails ?
                        user.venueBusinessDetails :
                        user?.salonBusinessDetails ?
                            user.salonBusinessDetails :
                            undefined
        }
        if (!user) throw new NotFoundException('User not found');
        return userObjToReturn;
    }

    async associateImagesWithUser(userId: string, imageUrls: string[]): Promise<void> {
        // Fetch the user by userId
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        // Assuming your User entity has an 'images' field which is an array of strings
        user.images = [...(user.images || []), ...imageUrls];
        user.coverImage = imageUrls[0];

        // Save the updated user
        await user.save();
    }

    async generateSmartPackage(input: SmartPackageInput): Promise<any> {
        // 1. Fetch all vendors (or you can filter by location, etc. if needed)
        const allVendors = await this.userModel.find();
        // 2. Filter packages by matching all requested services AND capacity
        const matchingPackages: VendorPackage[] = [];

        allVendors.forEach(vendor => {
            vendor.packages.forEach(pkg => {
                // Capacity check (if defined)
                const maxCapacity = vendor.venueBusinessDetails?.maximumPeopleCapacity ?? Infinity;
                if (input.guests > maxCapacity) {
                    return; // skip packages if capacity insufficient
                }

                // Check if package services include all requested services (simple substring match)
                // Convert package services string to lowercase for comparison
                const packageServicesLower = pkg.services.toLowerCase();

                const allServicesMatch = input.services.every(service =>
                    packageServicesLower.includes(service.toLowerCase())
                );

                if (allServicesMatch) {
                    matchingPackages.push({
                        vendorId: vendor._id.toString(),
                        packageName: pkg.packageName,
                        price: pkg.price,
                        services: pkg.services,
                        maximumCapacity: maxCapacity,
                    });
                }
            });
        });

        // 3. Select the cheapest package matching criteria
        const cheapestPackage = matchingPackages.sort((a, b) => a.price - b.price)[0];
        console.log(cheapestPackage);
        return {
            eventName: input.eventName,
            eventDate: input.eventDate,
            guests: input.guests,
            package: cheapestPackage || null,
        };
    }

}