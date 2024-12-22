// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './../auth/schemas/message.schema';

@Injectable()
export class ChatService {
    constructor(@InjectModel(Message.name) private messageModel: Model<Message>) { }

    async createMessage(user: string, content: string): Promise<Message> {
        const createdMessage = new this.messageModel({ user, content });
        return createdMessage.save();
    }

    async getAllMessages(): Promise<Message[]> {
        return this.messageModel.find().sort({ createdAt: 1 }).exec();
    }
}
