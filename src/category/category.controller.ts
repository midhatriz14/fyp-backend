import { Controller, Post, Body, Get } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateDto } from './dto/create.dto';

@Controller('category')
export class CategoryController {
    constructor(private categoryService: CategoryService) { }

    @Post()
    register(@Body() createDto: CreateDto) {
        return this.categoryService.create(createDto);
    }

    @Get()
    getAll() {
        return this.categoryService.getAll();
    }
}