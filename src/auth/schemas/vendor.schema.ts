import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Vendor extends Document {

  @Prop()
  vendor_id: string; 

  @Prop({ required: true })
  email: string;

  @Prop()
  password?: string;

  @Prop()
  name: string;

  @Prop()
  phone_number: string;

  @Prop()
  location: string;

  @Prop()
  category: string;

  @Prop()
  services: [];

  @Prop()
  ratings: number;

  @Prop()
  created_at: Date;

  @Prop()
  provider?: string;

  @Prop()
  providerId?: string;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);