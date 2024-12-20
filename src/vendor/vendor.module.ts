import { Module } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './../auth/schemas/user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema }
        ]),
    ],
    controllers: [VendorController],
    providers: [VendorService],
})
export class VendorModule { }