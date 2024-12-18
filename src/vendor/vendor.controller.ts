import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { CreateContactDetailsDto } from './dto/create-contact-details.dto';
import { CreatePhotographerBusinessDetailsDto } from './dto/create-photographer-business-details.dto';
import { CreateSalonBusinessDetailsDto } from './dto/create-salon-business-details.dto';
import { CreateVenueBusinessDetailsDto } from './dto/create-venue-business-details.dto';
import { CreateCateringBusinessDetailsDto } from './dto/create-catering-business-details.dto';
import { User } from 'src/auth/schemas/user.schema';
import { CreatePackagesDto } from './dto/create-package.dto';

@Controller('vendor')
export class VendorController {
    constructor(private vendorService: VendorService) { }

    @Get('getVendorsByCategoryId')
    getVendorsByCategoryId(@Query('categoryId') categoryId: string) {
        return this.vendorService.getAllVendorsByCategoryId(categoryId);
    }

    @Post('contactDetails')
    async createContactDetails(
        @Query('userId') userId: string,
        @Body() createContactDetailsDto: CreateContactDetailsDto): Promise<User> {
        return await this.vendorService.createContactDetails(userId, createContactDetailsDto);
    }

    @Post('buisnessDetails')
    async createPhotographerBuisnessDetails(
        @Query('userId') userId: string,
        @Body() dto:
            CreatePhotographerBusinessDetailsDto |
            CreateSalonBusinessDetailsDto |
            CreateVenueBusinessDetailsDto |
            CreateCateringBusinessDetailsDto) {
        return await this.vendorService.createBuisnessDetails(userId, dto);
    }

    @Post('packages')
    async addPackages(
        @Query('userId') userId: string,
        @Body() createPackagesDto: CreatePackagesDto,
    ) {
        return this.vendorService.addPackages(userId, createPackagesDto);
    }

    @Get('contact-details')
    async getContactDetails(@Param('userId') userId: string) {
        return this.vendorService.getContactDetails(userId);
    }

    // Get Business Details
    @Get('business-details')
    async getBusinessDetails(@Param('userId') userId: string) {
        return this.vendorService.getBusinessDetails(userId);
    }

    // Get Packages
    @Get('packages')
    async getPackages(@Param('userId') userId: string) {
        return this.vendorService.getPackages(userId);
    }

    @Get()
    async getVendor(@Query('userId') userId: string) {
        return this.vendorService.getVendor(userId);
    }
}