// notification.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { NotificationService } from './notifications.service';

@Controller('notifications')
export class NotificationController {
    constructor(private notificationService: NotificationService) { }

    @Post('send')
    send(@Body() body: { token: string; title: string; message: string }) {
        return this.notificationService.sendExpoPush(body.token, body.title, body.message);
    }
}
