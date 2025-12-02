import { IsString, IsNumber, IsEnum, IsOptional, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum Transmission {
  MANUELLE = 'manuelle',
  AUTOMATIQUE = 'automatique',
}

export class CreateVehicleDto {
  @ApiProperty({ example: 'SUV', description: 'Type de carrosserie du véhicule' })
  @IsString()
  carrosserie: string;

  @ApiProperty({ example: 'Q5', description: 'Modèle du véhicule' })
  @IsString()
  modele: string;

  @ApiProperty({ example: 'Audi', description: 'Marque du véhicule' })
  @IsString()
  marque: string;

  @ApiProperty({
    example: 'automatique',
    description: 'Transmission du véhicule',
    enum: Transmission,
  })
  @IsEnum(Transmission)
  transmission: Transmission;

  @ApiProperty({ example: 80, description: 'Prix de location par jour en euros' })
  @IsNumber()
  @Min(0)
  @Type(() => Number) 
  prix: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['http://localhost:9000/uploads/vehicles/audi-q5.jpg'],
    description: 'Liste des URLs des photos du véhicule',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiProperty({ example: 'TG-1234-AB', description: 'Immatriculation unique du véhicule' })
  @IsString()
  immatriculation: string;
}
