import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ContractDocument = HydratedDocument<Contract>;

export enum ContractStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Cancelled = 'cancelled',
}

@Schema({ collection: 'contracts', timestamps: true })
export class Contract {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // Utilisateur entreprise

  @Prop({ type: Types.ObjectId, ref: 'Vehicle' })
  vehicleId?: Types.ObjectId; // Véhicule concerné (optionnel)

  @Prop({ required: true })
  dateDebut: Date; // Date de début de location

  @Prop({ required: true })
  dateFin: Date; // Date de fin de location

  @Prop({ required: true, enum: ContractStatus, default: ContractStatus.Pending })
  statut: ContractStatus; // Statut du contrat

  @Prop({ required: true, min: 0 })
  montantTotal: number; // Montant total du contrat

  @Prop({ min: 0, default: 0 })
  acompteVerse: number; // Acompte versé

  @Prop()
  conditionsSpeciales?: string; // Conditions spéciales du contrat

  @Prop()
  commentaires?: string; // Commentaires de l'admin lors de la validation/rejet

  @Prop({ type: Date })
  dateValidation?: Date; // Date de validation par l'admin

  @Prop({ type: Types.ObjectId, ref: 'User' })
  validePar?: Types.ObjectId; // Admin qui a validé le contrat

  // Informations de l'agence (pour le PDF)
  @Prop()
  agenceNom?: string;

  @Prop()
  agenceAdresse?: string;

  @Prop()
  agenceTelephone?: string;

  @Prop()
  agenceEmail?: string;reserv

  @Prop()
  agenceLogo?: string;

  // Soft delete
  @Prop({ default: false })
  deleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);

// Index pour optimiser les recherches
ContractSchema.index({ userId: 1 });
ContractSchema.index({ vehicleId: 1 });
ContractSchema.index({ statut: 1 });
ContractSchema.index({ deleted: 1 });
ContractSchema.index({ createdAt: -1 });