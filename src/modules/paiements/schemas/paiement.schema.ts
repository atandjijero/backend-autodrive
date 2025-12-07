import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaiementDocument = Paiement & Document;

export enum StatutPaiement {
  Reussi = 'reussi',
  Echoue = 'echoue',
}

@Schema({ timestamps: true })
export class Paiement {
  @Prop({ type: Types.ObjectId, ref: 'Reservation', required: true })
  reservationId: Types.ObjectId;

  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  montant: number;

  @Prop({ required: true })
  numeroCarte: string;

  @Prop({ required: true })
  expiration: string;

  @Prop({ required: true })
  cvv: string;

  @Prop({ enum: StatutPaiement, default: StatutPaiement.Reussi })
  statut: StatutPaiement;
}

export const PaiementSchema = SchemaFactory.createForClass(Paiement);
