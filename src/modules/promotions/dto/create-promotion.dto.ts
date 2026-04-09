import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsEnum, IsNumber, IsDateString, IsOptional, Min, IsArray } from 'class-validator';
import { TypePromotion } from '@prisma/client';

export class CreatePromotionDto {
  @ApiProperty({
    description: 'Titre de la promotion',
    example: 'Réduction Hiver 2026',
  })
  @IsString()
  titre!: string;

  @ApiProperty({
    description: 'Description détaillée de la promotion',
    example: 'Profitez de 20% de réduction sur toutes les locations cet hiver',
  })
  @IsString()
  description!: string;

  @ApiProperty({
    description: 'Type de promotion',
    enum: TypePromotion,
    example: TypePromotion.pourcentage,
  })
  @IsEnum(TypePromotion)
  type!: TypePromotion;

  @ApiProperty({
    description: 'Valeur de la réduction (pourcentage ou montant fixe)',
    example: 20,
  })
  @IsNumber()
  @Min(0)
  valeur!: number;

  @ApiProperty({
    description: 'Date de début de validité',
    example: '2026-01-01',
  })
  @IsDateString()
  dateDebut!: string;

  @ApiProperty({
    description: 'Date de fin de validité',
    example: '2026-03-31',
  })
  @IsDateString()
  dateFin!: string;

  @ApiProperty({
    description: 'IDs des véhicules spécifiques (optionnel pour promo globale)',
    example: [123],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  vehiculesIds?: number[];

  @ApiProperty({
    description: 'Nombre maximum d\'utilisations (0 = illimité)',
    example: 100,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  utilisationMax?: number;

  @ApiProperty({
    description: 'Codes promo associés',
    example: ['HIVER2026', 'WINTER20'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  codesPromo?: string[];

  @ApiProperty({
    description: 'Durée minimum de location en jours',
    example: 3,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  dureeMinLocation?: number;

  @ApiProperty({
    description: 'Montant minimum de commande',
    example: 50,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  montantMinCommande?: number;
}