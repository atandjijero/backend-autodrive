import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleDto } from './create-vehicule.dto';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  // Ici tu peux ajouter uniquement les champs spécifiques à l’update
  // Exemple : liste de photos supplémentaires
  photos?: string[];
}
