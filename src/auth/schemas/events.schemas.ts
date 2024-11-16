import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Event extends Document {

  @Prop()
  user_id: string; 

  @Prop()
  event_id: string;

  @Prop()
  event_type: string;

  @Prop()
  event_date: Date;

  @Prop()
  budget: number;

  @Prop()
  vendor_booked: [];

  @Prop()
  created_at: Date;

  @Prop()
  provider?: string;

  @Prop()
  providerId?: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);