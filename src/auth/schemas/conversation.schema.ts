// src/chat/schemas/conversation.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Conversation extends Document {
    @Prop({ required: true })
    chatId: string;  // Unique ID for the conversation (can be generated or mapped from participants)

    @Prop({ required: true })
    participants: string[];  // Array of participant userIds

    @Prop({ default: Date.now })
    createdAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
