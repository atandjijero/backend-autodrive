import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReservationDocument = HydratedDocument<Reservation>;

export enum StatutReservation {
  EnCours = 'en cours',
  Terminee = 'terminée',
  Annulee = 'annulée',
}

@Schema({ collection: 'reservations', timestamps: true })
export class Reservation {
  @Prop({ type: Types.ObjectId, ref: 'Vehicle', required: true })
  vehicleId: Types.ObjectId | any;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  clientId: Types.ObjectId | any;

  @Prop({ required: true })
  dateDebut: Date;

  @Prop({ required: true })
  dateFin: Date;

  @Prop({ enum: StatutReservation, default: StatutReservation.EnCours })
  statut: StatutReservation;
  @Prop({ required: true, unique: true })
  numeroReservation: string;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
