import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { CreateContactDetailsDto } from './dto/create-contact-details.dto';
import { CreatePhotographerBusinessDetailsDto } from './dto/create-photographer-business-details.dto';
import { CreateSalonBusinessDetailsDto } from './dto/create-salon-business-details.dto';
import { CreateVenueBusinessDetailsDto } from './dto/create-venue-business-details.dto';
import { CreateCateringBusinessDetailsDto } from './dto/create-catering-business-details.dto';
import { User } from 'src/auth/schemas/user.schema';

@Controller('vendor')
export class VendorController {
    constructor(private vendorService: VendorService) { }

    @Get('getVendorsByCategoryId')
    getVendorsByCategoryId(@Query('categoryId') categoryId: string) {
        return this.vendorService.getAllVendorsByCategoryId(categoryId);
    }

    @Post('contactDetails/:userId')
    async createContactDetails(
        @Query('userId') userId: string,
        @Body() createContactDetailsDto: CreateContactDetailsDto): Promise<User> {
        console.log(userId, createContactDetailsDto);
        return await this.vendorService.createContactDetails(userId, createContactDetailsDto);
    }

    @Post('buisnessDetails')
    async createPhotographerBuisnessDetails(
        @Param('userId') userId: string,
        @Body() dto:
            CreatePhotographerBusinessDetailsDto |
            CreateSalonBusinessDetailsDto |
            CreateVenueBusinessDetailsDto |
            CreateCateringBusinessDetailsDto) {
        return await this.vendorService.createBuisnessDetails(userId, dto);
    }
}