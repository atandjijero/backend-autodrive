import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AgencyDocument = Agency & Document;

@Schema({ timestamps: true })
export class Agency {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  postalCode: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  manager?: string;

  @Prop()
  description?: string;

  @Prop()
  logo?: string;

  @Prop({
    type: { type: String, enum: ['Point'] },
    coordinates: [Number]
  })
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };

  @Prop({ default: true })
  isActive: boolean;
}

export const AgencySchema = SchemaFactory.createForClass(Agency);
AgencySchema.index({ name: 'text', city: 'text' });
AgencySchema.index({ location: '2dsphere' }); // Index géospatial pour les recherches par proximité

export { Agency as AgencyModel };