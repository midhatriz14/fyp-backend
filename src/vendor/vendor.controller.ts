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
import { FilesInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';

@Controller('vendor')
export class VendorController {
    private readonly logger = new Logger("fyp")
    constructor(private vendorService: VendorService) { }

    @Get('getVendorsByCategoryId')
    getVendorsByCategoryId(@Request() req: any, @Query('categoryId') categoryId: string) {
        return this.vendorService.getAllVendorsByCategoryId(categoryId);
    }

    @Post('contactDetails')
    async createContactDetails(
        @Query("userId") userId: string,
        @Body() createContactDetailsDto: CreateContactDetailsDto): Promise<User> {
        this.logger.log(userId, "contactDetails");
        return await this.vendorService.createContactDetails(userId, createContactDetailsDto);
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
    @UseInterceptors(
        FilesInterceptor('files', 30, { // 'files' is the field name; 30 is the max number of files
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
                fileSize: 5 * 1024 * 1024, // 5MB file size limit per file
            },
        }),
    )
    async uploadImages(@Query('userId') userId: string, @UploadedFiles() files: any[]) {
        if (!files || files.length === 0) {
            throw new HttpException('Files not provided', HttpStatus.BAD_REQUEST);
        }

        // Construct URLs for each uploaded file
        const fileUrls = files.map(file => `/public/images/${file.filename}`);

        // Optionally, you can associate these URLs with the user in your service
        await this.vendorService.associateImagesWithUser(userId, fileUrls);

        return {
            message: 'Images uploaded successfully',
            urls: fileUrls,
        };
    }
}