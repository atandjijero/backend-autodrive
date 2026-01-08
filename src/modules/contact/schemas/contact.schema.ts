import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContactDocument = Contact & Document;

@Schema({ timestamps: true })
export class Contact {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: 'pending' })
  status: 'pending' | 'responded';

  @Prop()
  response?: string;

  @Prop()
  respondedAt?: Date;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);