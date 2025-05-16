import { Controller, Post, Body, Get, Query, UseInterceptors, HttpException, HttpStatus, UploadedFile, UseGuards, Request, Param, Logger, UploadedFiles } from '@nestjs/common';
import { SmartPackageInput, VendorService } from './vendor.service';
import { CreateContactDetailsDto } from './dto/create-contact-details.dto';
import { CreatePhotographerBusinessDetailsDto } from './dto/create-photographer-business-details.dto';
import { CreateSalonBusinessDetailsDto } from './dto/create-salon-business-details.dto';
import { CreateVenueBusinessDetailsDto } from './dto/create-venue-business-details.dto';
import { CreateCateringBusinessDetailsDto } from './dto/create-catering-business-details.dto';
import { User } from 'src/auth/schemas/user.schema';
import { CreatePackagesDto } from './dto/create-package.dto';
import { diskStorage } from 'multer';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { FileUploadService } from 'src/file-upload/file-upload.service';

@Controller('vendor')
export class VendorController {
    private readonly logger = new Logger("fyp")
    constructor(private vendorService: VendorService, private fileUploadService: FileUploadService) { }

    @Get('getVendorsByCategoryId')
    getVendorsByCategoryId(@Request() req: any, @Query('categoryId') categoryId: string) {
        return this.vendorService.getAllVendorsByCategoryId(categoryId);
    }

    @Post('contactDetails')
    @UseInterceptors(FileInterceptor('file'))
    async createContactDetails(
        @Query("userId") userId: string,
        @Body() createContactDetailsDto: CreateContactDetailsDto, @UploadedFile() file: Express.Multer.File): Promise<User> {
        return await this.vendorService.createContactDetails(userId, createContactDetailsDto, file);
    }

    @Post('buisnessDetails')
    async createPhotographerBuisnessDetails(
        @Query("userId") userId: string,
        @Body() dto:
            CreatePhotographerBusinessDetailsDto |
            CreateSalonBusinessDetailsDto |
            CreateVenueBusinessDetailsDto |
            CreateCateringBusinessDetailsDto) {
        this.logger.log(userId, "buisnessDetails");
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

    @Post('ai-package')
    async getSmartPackage(@Body() smartPackageDto: SmartPackageInput,) {
        smartPackageDto.guests = parseInt(smartPackageDto.guests.toString());
        smartPackageDto.budget = parseInt(smartPackageDto.budget.toString());
        return this.vendorService.generateSmartPackage({ ...smartPackageDto });
    }

    @Post('image')
    @UseInterceptors(FilesInterceptor('files', 10)) // accepts up to 10 files
    async uploadImages(@Query('userId') userId: string, @UploadedFiles() files: Express.Multer.File[]) {
        if (!files || files.length === 0) {
            throw new HttpException('No files provided', HttpStatus.BAD_REQUEST);
        }

        const urls = await this.fileUploadService.uploadMultipleFiles(files);

        // Optionally, you can associate these URLs with the user in your service
        await this.vendorService.associateImagesWithUser(userId, urls);

        return {
            message: 'Images uploaded successfully',
            urls: urls,
        };
    }
}