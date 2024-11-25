import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { VendorService } from './vendor.service';

@Controller('vendor')
export class VendorController {
    constructor(private vendorService: VendorService) { }

    @Get('getVendorsByCategoryId')
    getVendorsByCategoryId(@Query('categoryId') categoryId: string) {
        return this.vendorService.getAllVendorsByCategoryId(categoryId);
    }
}