import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Bookings extends Document {

  @Prop()
  booking_id: string;  

  @Prop()
  user_id: string; 

  @Prop()
  vendor_id: string;

  @Prop()
  services_id: string;

  @Prop()
  event_date: Date;

  @Prop()
  status: string;

  @Prop()
  created_at: Date;

  @Prop()
  provider?: string;

  @Prop()
  providerId?: string;
}

export const BookingsSchema = SchemaFactory.createForClass(Bookings);