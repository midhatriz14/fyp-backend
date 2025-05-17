// src/reviews/reviews.module.ts
import { Module } from '@nestjs/common';
import { NotificationController } from './notifications.controller';
import { NotificationService } from './notifications.service';

@Module({
    imports: [],
    controllers: [NotificationController],
    providers: [NotificationService],
})
export class NotificationsModule { }
