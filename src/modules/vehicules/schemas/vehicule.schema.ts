import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VehicleDocument = HydratedDocument<Vehicle>;

@Schema({ collection: 'vehicles', timestamps: true })
export class Vehicle {
  @Prop({ required: true })
  carrosserie: string; // Type de carrosserie

  @Prop({ required: true })
  modele: string; // Modèle du véhicule

  @Prop({ required: true })
  marque: string; // Marque du véhicule

  @Prop({ required: true, enum: ['manuelle', 'automatique'] })
  transmission: 'manuelle' | 'automatique'; // Transmission

  @Prop({ required: true, min: 0 })
  prix: number; // Prix de location par jour

  @Prop({ type: [String], default: [] })
  photos: string[]; // URLs des photos

  @Prop({ required: true, unique: true })
  immatriculation: string; // Immatriculation unique

  // Soft delete
  @Prop({ default: false })
  deleted: boolean; // Indique si le véhicule est supprimé

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null; // Date de suppression logique
  @Prop({ default: true }) // véhicule disponible par défaut
  disponible: boolean;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);

// Index pour optimiser les recherches fréquentes
VehicleSchema.index({ marque: 1 });
VehicleSchema.index({ modele: 1 });
VehicleSchema.index({ deleted: 1 });
