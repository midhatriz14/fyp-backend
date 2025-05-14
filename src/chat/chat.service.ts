// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './../auth/schemas/message.schema';
import { Conversation } from 'src/auth/schemas/conversation.schema';

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<Message>,
        @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    ) { }

    // Create a new conversation
    async createConversation(participants: string[]): Promise<Conversation> {
        const chatId = participants.sort().join('-');  // Chat ID can be a sorted combination of participant IDs
        const existingConversation = await this.conversationModel.findOne({ chatId });
        if (existingConversation) return existingConversation;

        const conversation = new this.conversationModel({ chatId, participants });
        return conversation.save();
    }

    async createOrGetConversation(userId: string, vendorId: string): Promise<string> {
        // Sort userId and vendorId to always have a consistent chatId
        const participants = [userId, vendorId].sort();
        const chatId = participants.join('-'); // Unique chatId based on participants

        // Check if conversation already exists
        let conversation = await this.conversationModel.findOne({ chatId });

        if (!conversation) {
            // If no conversation exists, create a new one
            conversation = new this.conversationModel({
                chatId,
                participants,
            });
            await conversation.save();
        }

        return conversation.chatId; // Return the chatId of the conversation
    }

    // Get all conversations for a user
    async getUserConversations(userId: string): Promise<Conversation[]> {
        return this.conversationModel.find({ participants: userId }).exec();
    }

    // Create a new message for a conversation
    async createMessage(chatId: string, senderId: string, content: string): Promise<Message> {
        const message = new this.messageModel({ chatId, senderId, message: content, receiverId: senderId });
        return message.save();
    }

    // Get all messages for a conversation
    async getMessagesForConversation(chatId: string): Promise<Message[]> {
        return this.messageModel.find({ chatId }).sort({ timestamp: 1 }).exec();
    }
}
