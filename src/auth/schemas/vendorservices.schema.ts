import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class VendorServices extends Document {

  @Prop()
  services_id: string; 

  @Prop()
  vendor_id: string; 

  @Prop()
  vendor_name: string;

  @Prop()
  description: string;

  @Prop()
  price: number;

  @Prop()
  package_details: [];

  @Prop()
  availability: boolean;

  @Prop()
  created_at: Date;

  @Prop()
  provider?: string;

  @Prop()
  providerId?: string;
}

export const VendorServicesSchema = SchemaFactory.createForClass(VendorServices);