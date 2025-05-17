// notification.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NotificationService {
    async sendExpoPush(token: string, title: string, body: string) {
        const message = {
            to: token,
            sound: 'default',
            title,
            body,
        };

        try {
            const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Expo push error:', error);
            throw error;
        }
    }
}
