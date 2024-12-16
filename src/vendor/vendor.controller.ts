import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { CreateContactDetailsDto } from './dto/create-contact-details.dto';
import { ContactDetails } from 'src/auth/schemas/contact-details.schema';
import { CreatePhotographerBusinessDetailsDto } from './dto/create-photographer-business-details.dto';
import { CreateSalonBusinessDetailsDto } from './dto/create-salon-business-details.dto';
import { CreateVenueBusinessDetailsDto } from './dto/create-venue-business-details.dto';
import { CreateCateringBusinessDetailsDto } from './dto/create-catering-business-details.dto';

@Controller('vendor')
export class VendorController {
    constructor(private vendorService: VendorService) { }

    @Get('getVendorsByCategoryId')
    getVendorsByCategoryId(@Query('categoryId') categoryId: string) {
        return this.vendorService.getAllVendorsByCategoryId(categoryId);
    }

    @Post('contactDetails')
    async create(@Body() createContactDetailsDto: CreateContactDetailsDto): Promise<ContactDetails> {
        return await this.vendorService.createContactDetails(createContactDetailsDto);
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