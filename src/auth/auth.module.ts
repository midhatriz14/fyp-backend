import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from './schemas/user.schema';
import { Vendor, VendorSchema } from './schemas/vendor.schema';
import { VendorServices, VendorServicesSchema } from './schemas/vendorservices.schema';
import { Reviews, ReviewsSchema } from './schemas/reviews.schema';
import { Event, EventSchema } from './schemas/events.schemas';
import { Bookings, BookingsSchema } from './schemas/bookings.schema';
import { Category, CategorySchema } from './schemas/category.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { Review, ReviewSchema } from './schemas/review.schema';
import { Notification, NotificationSchema } from './schemas/notification.schema';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1d' },
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: VendorServices.name, schema: VendorServicesSchema },
      { name: Reviews.name, schema: ReviewsSchema },
      { name: Event.name, schema: EventSchema },
      { name: Bookings.name, schema: BookingsSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Message.name, schema: MessageSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, FacebookStrategy],
})
export class AuthModule { }