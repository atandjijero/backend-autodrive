import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum Role {
  Admin = 'admin',
  Client = 'client',
  Entreprise = 'entreprise',
  Tourist = 'tourist',
}

@Schema({ timestamps: true })
export class User {
  _id?: Types.ObjectId;

  @Prop({ enum: Role, default: Role.Client })
  role: Role;

  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  prenom: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  motPasse: string; // à hasher avec bcrypt

  @Prop({ required: true })
  telephone: string;

  @Prop()
  telephoneSecondaire?: string;

  @Prop()
  adresse: string;

  @Prop({ default: () => new Date().toISOString() })
  dateInscription: string;

  //  OTP
  @Prop()
  otpCode?: string;

  @Prop()
  otpExpires?: Date;

  @Prop({ default: false })
  isVerified: boolean;

  //  Reset password
  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  //  Soft delete
  @Prop({ default: false })
  deleted: boolean;

  @Prop({ type: Date, default: null }) 
  deletedAt?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
