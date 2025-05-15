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
    services: string;  // string describing the service(s) provided by this package
    maximumCapacity?: number;
}

export interface SmartPackageInput {
    eventName: string;
    eventDate: Date;
    guests: number;
    services: string[];  // requested services, e.g. ['catering', 'decoration', 'photography']
    budget: number
}


@Injectable()
export class VendorService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Category.name) private categoryModel: Model<Category>,
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

    // interface VendorPackage {
    //     vendorId: string;
    //     packageName: string;
    //     price: number;
    //     services: string; // services as string, ideally convert to array for better matching
    //     maximumCapacity?: number;
    //   }

    //   interface SmartPackageInput {
    //     eventName: string;
    //     eventDate: Date;
    //     guests: number;
    //     services: string[];  // requested services
    //   }

    // async generateSmartPackage(input: SmartPackageInput): Promise<any> {
    //     const chosenPackages: any[] = [];

    //     for (const requestedService of input.services) {
    //         const bestPackage = await this.findBestVendorForService(requestedService, input.guests);
    //         if (bestPackage) {
    //             chosenPackages.push(bestPackage);
    //         }
    //     }

    //     const totalCost = chosenPackages.reduce((sum, pkg) => sum + pkg.price, 0);

    //     return {
    //         eventName: input.eventName,
    //         eventDate: input.eventDate,
    //         guests: input.guests,
    //         packages: chosenPackages,
    //         totalCost,
    //     };
    // }
    // async findBestVendorForService(service: string, guests: number) {
    //     // Normalize service string
    //     const serviceLower = service.toLowerCase();

    //     // Find category by service name (case-insensitive exact match)
    //     const categoryObj = await this.categoryModel.findOne({
    //         name: { $regex: new RegExp(`^${service}$`, 'i') }
    //     });

    //     if (!categoryObj) {
    //         throw new Error(`Category not found for service: ${service}`);
    //     }

    //     const categoryId = categoryObj._id;

    //     // Aggregation pipeline: get vendors with matching category and packages
    //     const pipeline = [
    //         {
    //             $match: {
    //                 role: 'Vendor',
    //                 packages: { $exists: true, $not: { $size: 0 } },
    //                 buisnessCategory: categoryId,
    //             }
    //         },
    //         {
    //             $addFields: {
    //                 BusinessDetails: {
    //                     $cond: [
    //                         { $ifNull: ['$salonBusinessDetails', false] }, '$salonBusinessDetails',
    //                         {
    //                             $cond: [
    //                                 { $ifNull: ['$venueBusinessDetails', false] }, '$venueBusinessDetails',
    //                                 {
    //                                     $cond: [
    //                                         { $ifNull: ['$cateringBusinessDetails', false] }, '$cateringBusinessDetails',
    //                                         '$photographerBusinessDetails'
    //                                     ]
    //                                 }
    //                             ]
    //                         }
    //                     ]
    //                 }
    //             }
    //         },
    //         {
    //             $project: {
    //                 salonBusinessDetails: 0,
    //                 venueBusinessDetails: 0,
    //                 cateringBusinessDetails: 0,
    //                 photographerBusinessDetails: 0
    //             }
    //         }
    //     ];

    //     // Execute aggregation
    //     const vendors = await this.userModel.aggregate(pipeline).exec();

    //     // Filter vendors by guest capacity
    //     const filteredVendors = vendors.filter(v => {
    //         const maxCapacity = v.BusinessDetails?.maximumPeopleCapacity ?? Infinity;
    //         // return guests <= maxCapacity;
    //         return true;
    //     });

    //     // Flatten all packages from filtered vendors (no filtering by services inside packages)
    //     const servicePackages = filteredVendors.flatMap(vendor =>
    //         vendor.packages.map((pkg: any) => ({
    //             vendorId: vendor._id.toString(),
    //             vendorName: vendor.name,
    //             packageName: pkg.packageName,
    //             price: pkg.price,
    //             services: pkg.services,
    //             maximumCapacity: vendor.BusinessDetails?.maximumPeopleCapacity ?? Infinity,
    //         }))
    //     );

    //     // if (servicePackages.length === 0) {
    //     //     throw new Error(`No vendors found for service category: ${categoryObj.name}`);
    //     // }
    //     if (servicePackages.length !== 0) {
    //         return servicePackages.reduce((prev, curr) => (prev.price < curr.price ? prev : curr));
    //     }
    //     // Pick the cheapest package overall

    // }

    // 1. Get all packages for a service (vendors matching the service category)
    async findAllVendorPackagesForService(service: string, guests: number) {
        // Find category by service name (case-insensitive exact match)
        const categoryObj = await this.categoryModel.findOne({
            name: { $regex: new RegExp(`^${service}$`, 'i') }
        });

        if (!categoryObj) {
            throw new Error(`Category not found for service: ${service}`);
        }

        const categoryId = categoryObj._id;

        // Aggregation pipeline: vendors matching category
        const pipeline = [
            {
                $match: {
                    role: 'Vendor',
                    packages: { $exists: true, $not: { $size: 0 } },
                    buisnessCategory: categoryId,
                }
            },
            {
                $addFields: {
                    BusinessDetails: {
                        $cond: [
                            { $ifNull: ['$salonBusinessDetails', false] }, '$salonBusinessDetails',
                            {
                                $cond: [
                                    { $ifNull: ['$venueBusinessDetails', false] }, '$venueBusinessDetails',
                                    {
                                        $cond: [
                                            { $ifNull: ['$cateringBusinessDetails', false] }, '$cateringBusinessDetails',
                                            '$photographerBusinessDetails'
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $project: {
                    salonBusinessDetails: 0,
                    venueBusinessDetails: 0,
                    cateringBusinessDetails: 0,
                    photographerBusinessDetails: 0
                }
            }
        ];

        const vendors = await this.userModel.aggregate(pipeline).exec();

        // Filter by guest capacity
        const filteredVendors = vendors.filter(v => {
            const maxCapacity = v.BusinessDetails?.maximumPeopleCapacity ?? Infinity;
            return guests <= maxCapacity;
        });

        // Flatten all packages with vendor info
        const packages = filteredVendors.flatMap(vendor =>
            vendor.packages.map((pkg: any) => ({
                vendorId: vendor._id.toString(),
                vendorName: vendor.name,
                packageName: pkg.packageName,
                price: pkg.price,
                services: pkg.services,
                maximumCapacity: vendor.BusinessDetails?.maximumPeopleCapacity ?? Infinity,
            }))
        );

        return packages;
    }

    // 2. Generate smart package with budget-aware backtracking selection
    async generateSmartPackage(input: SmartPackageInput) {
        const services = input.services;
        const budget = input.budget;
        const guests = input.guests;

        // Fetch all candidates per service
        const allCandidates: { [service: string]: any[] } = {};
        for (const service of services) {
            const candidates = await this.findAllVendorPackagesForService(service, guests);
            allCandidates[service] = candidates || [];
        }

        let bestCombination: any[] = [];
        let bestCount = 0;
        let bestCost = Infinity;

        // Backtracking function
        function backtrack(index: number, chosen: any[], currentCost: number) {
            if (currentCost > budget) return; // prune

            if (index === services.length) {
                // Check if this selection is better than current best
                if (
                    chosen.length > bestCount ||
                    (chosen.length === bestCount && currentCost < bestCost)
                ) {
                    bestCount = chosen.length;
                    bestCost = currentCost;
                    bestCombination = [...chosen];
                }
                return;
            }

            const service = services[index];
            const candidates = allCandidates[service];

            // Option 1: skip this service
            backtrack(index + 1, chosen, currentCost);

            // Option 2: try each candidate package for this service
            for (const pkg of candidates) {
                // Calculate price considering Catering special rule
                const priceToAdd =
                    service.toLowerCase() === 'caterings' ? pkg.price * guests : pkg.price;

                backtrack(index + 1, [...chosen, pkg], currentCost + priceToAdd);
            }
        }

        backtrack(0, [], 0);

        if (bestCombination.length === 0) {
            throw new Error(`Cannot find any package combination within budget ${budget}`);
        }

        // Calculate totalCost to reflect Catering pricing as well
        const totalCost = bestCombination.reduce((sum, pkg) => {
            // Find the service this package belongs to
            const pkgService = services.find(s =>
                allCandidates[s].some(c => c.vendorId === pkg.vendorId && c.packageName === pkg.packageName)
            );
            if (!pkgService) return sum;
            return sum + (pkgService.toLowerCase() === 'caterings' ? pkg.price * guests : pkg.price);
        }, 0);

        return {
            eventName: input.eventName,
            eventDate: input.eventDate,
            guests,
            packages: bestCombination,
            totalCost,
            budget,
        };
    }




}