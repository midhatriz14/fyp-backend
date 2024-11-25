import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../auth/schemas/user.schema';

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
            buisnessCategories: new Types.ObjectId(categoryId),
        });

        return vendors;
    }
}