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
}