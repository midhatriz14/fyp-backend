// src/chat/conversation.controller.ts
import { Controller, Post, Param, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
    constructor(private chatService: ChatService) { }

    @Post(':userId/:vendorId')
    async createOrGetConversation(
        @Param('userId') userId: string,
        @Param('vendorId') vendorId: string,
    ) {
        const chatId = await this.chatService.createOrGetConversation(userId, vendorId);
        return { chatId }; // Return the chatId (either from existing or newly created)
    }
}
