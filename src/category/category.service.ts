import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../auth/schemas/category.schema';
import { CreateDto } from './dto/create.dto';

@Injectable()
export class CategoryService {
    constructor(
        @InjectModel(Category.name) private categoryModel: Model<Category>,
    ) { }

    async create(createDto: CreateDto) {
        const existingCategory = await this.categoryModel.findOne({ name: createDto.name });
        if (existingCategory) {
            throw new UnauthorizedException('Category already exists');
        }

        const category = await this.categoryModel.create({
            name: createDto.name,
            image: createDto.pictureUrl,
            description: createDto.description,
        });

        return category;
    }

    async getAll() {
        const categories = await this.categoryModel.find();
        return categories;
    }
}