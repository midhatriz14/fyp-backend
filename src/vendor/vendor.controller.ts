import { Controller, Post, Body, Get, Query, UseInterceptors, HttpException, HttpStatus, UploadedFile, UseGuards, Request } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { CreateContactDetailsDto } from './dto/create-contact-details.dto';
import { CreatePhotographerBusinessDetailsDto } from './dto/create-photographer-business-details.dto';
import { CreateSalonBusinessDetailsDto } from './dto/create-salon-business-details.dto';
import { CreateVenueBusinessDetailsDto } from './dto/create-venue-business-details.dto';
import { CreateCateringBusinessDetailsDto } from './dto/create-catering-business-details.dto';
import { User } from 'src/auth/schemas/user.schema';
import { CreatePackagesDto } from './dto/create-package.dto';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { AuthGuard } from '@nestjs/passport';

@Controller('vendor')
export class VendorController {
    constructor(private vendorService: VendorService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get('getVendorsByCategoryId')
    getVendorsByCategoryId(@Request() req: any, @Query('categoryId') categoryId: string) {
        const userId = req.user.id;
        console.log(userId);
        return this.vendorService.getAllVendorsByCategoryId(categoryId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('contactDetails')
    async createContactDetails(
        @Request() req: any,
        @Body() createContactDetailsDto: CreateContactDetailsDto): Promise<User> {
        const userId = req.user.id;
        console.log("userId", userId);
        return await this.vendorService.createContactDetails(userId, createContactDetailsDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('buisnessDetails')
    async createPhotographerBuisnessDetails(
        @Request() req: any,
        @Body() dto:
            CreatePhotographerBusinessDetailsDto |
            CreateSalonBusinessDetailsDto |
            CreateVenueBusinessDetailsDto |
            CreateCateringBusinessDetailsDto) {
        const userId = req.user.id;
        console.log("userId", userId);
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
        @Post('image')
        @UseInterceptors(
            FileInterceptor('file', {
                storage: diskStorage({
                    destination: './public/images', // Destination folder
                    filename: (req: any, file: any, callback: any) => {
                        // Generate a unique filename
                        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                        const ext = extname(file.originalname);
                        callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
                    },
                }),
                fileFilter: (req, file, callback) => {
                    // Accept only image files
                    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
                        return callback(
                            new HttpException('Only image files are allowed!', HttpStatus.BAD_REQUEST),
                            false,
                        );
                    }
                    callback(null, true);
                },
                limits: {
                    fileSize: 5 * 1024 * 1024, // 5MB file size limit
                },
            }),
        )
        async uploadImage(@UploadedFile() file: any) {
            if (!file) {
                throw new HttpException('File not provided', HttpStatus.BAD_REQUEST);
            }

            // Return the path to access the uploaded image
            return {
                message: 'Image uploaded successfully',
                url: `/public/images/${file.filename}`,
            };
        }
    }