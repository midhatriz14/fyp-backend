// src/reviews/reviews.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReviewDto } from './dto/create-review.dto';
import { Review } from 'src/auth/schemas/review.schema';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectModel(Review.name) private reviewModel: Model<Review>,
    ) { }

    async createReview(userId: string, dto: CreateReviewDto): Promise<Review> {
        return this.reviewModel.create({ ...dto, userId });
    }

    async getVendorReviews(vendorId: string): Promise<Review[]> {
        return this.reviewModel
            .find({ vendorId })
            .populate('userId', 'name')
            .sort({ createdAt: -1 });
    }
}
