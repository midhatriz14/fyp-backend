import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CateringBusinessDetails, PhotographerBusinessDetails, SalonBusinessDetails, User, VenueBusinessDetails } from '../auth/schemas/user.schema';
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
        if (!Types.ObjectId.isValid(categoryId)) {
            throw new Error('Invalid categoryId');
        }
        const vendors = await this.userModel.find({
            role: 'Vendor', // Ensure only vendors are returned
            buisnessCategory: new Types.ObjectId(categoryId),
        });

        return vendors;
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
        const user = await this.userModel.findById(userId);
        if (!user) throw new NotFoundException('User not found');
        return user;
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