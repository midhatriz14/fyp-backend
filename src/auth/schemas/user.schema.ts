import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {

  @Prop()
  user_id: string; 

  @Prop({ required: true })
  email: string;

  @Prop()
  password?: string;

  @Prop()
  name: string;

  @Prop()
  phone_number: string;

  @Prop()
  city: string;

  @Prop()
  role: string;

  @Prop()
  created_at: Date;

  @Prop()
  provider?: string;

  @Prop()
  providerId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);