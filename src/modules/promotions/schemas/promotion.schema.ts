import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PromotionDocument = HydratedDocument<Promotion>;

export enum TypePromotion {
  Pourcentage = 'pourcentage',
  MontantFixe = 'montant_fixe',
}

export enum StatutPromotion {
  Active = 'active',
  Inactive = 'inactive',
  Expired = 'expired',
}

@Schema({ collection: 'promotions', timestamps: true })
export class Promotion {
  @Prop({ required: true })
  titre: string; // Titre de la promotion

  @Prop({ required: true })
  description: string; // Description détaillée

  @Prop({ required: true, enum: TypePromotion })
  type: TypePromotion; // Type de promotion

  @Prop({ required: true, min: 0 })
  valeur: number; // Valeur de la réduction (pourcentage ou montant)

  @Prop({ required: true })
  dateDebut: Date; // Date de début de validité

  @Prop({ required: true })
  dateFin: Date; // Date de fin de validité

  @Prop({ type: Types.ObjectId, ref: 'Vehicle' })
  vehiculeId?: Types.ObjectId; // Véhicule spécifique (optionnel pour promo globale)

  @Prop({ required: true, enum: StatutPromotion, default: StatutPromotion.Active })
  statut: StatutPromotion; // Statut de la promotion

  @Prop({ default: 0 })
  utilisationMax?: number; // Nombre maximum d'utilisations (0 = illimité)

  @Prop({ default: 0 })
  utilisations: number; // Nombre d'utilisations actuelles

  @Prop({ type: [String], default: [] })
  codesPromo: string[]; // Codes promo associés

  // Conditions d'application
  @Prop({ default: 1 })
  dureeMinLocation?: number; // Durée minimum de location en jours

  @Prop({ default: 0 })
  montantMinCommande?: number; // Montant minimum de commande

  // Soft delete
  @Prop({ default: false })
  deleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);

// Index pour optimiser les recherches
PromotionSchema.index({ statut: 1 });
PromotionSchema.index({ dateDebut: 1, dateFin: 1 });
PromotionSchema.index({ vehiculeId: 1 });
PromotionSchema.index({ codesPromo: 1 });
PromotionSchema.index({ deleted: 1 });