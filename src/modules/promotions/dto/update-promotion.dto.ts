import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsEnum, IsNumber, IsDateString, IsOptional, Min, IsArray } from 'class-validator';
import { TypePromotion } from '@prisma/client';

export class UpdatePromotionDto {
  @ApiPropertyOptional({
    description: 'Titre de la promotion',
    example: 'Réduction Printemps 2026',
  })
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiPropertyOptional({
    description: 'Description détaillée de la promotion',
    example: 'Profitez de 15% de réduction sur toutes les locations ce printemps',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Type de promotion',
    enum: TypePromotion,
    example: TypePromotion.pourcentage,
  })
  @IsOptional()
  @IsEnum(TypePromotion)
  type?: TypePromotion;

  @ApiPropertyOptional({
    description: 'Valeur de la réduction (pourcentage ou montant fixe)',
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valeur?: number;

  @ApiPropertyOptional({
    description: 'Date de début de validité',
    example: '2026-04-01',
  })
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional({
    description: 'Date de fin de validité',
    example: '2026-06-30',
  })
  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @ApiPropertyOptional({
    description: 'IDs des véhicules spécifiques (optionnel pour promo globale)',
    example: [123],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  vehiculesIds?: number[];

  @ApiPropertyOptional({
    description: 'Nombre maximum d\'utilisations (0 = illimité)',
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  utilisationMax?: number;

  @ApiPropertyOptional({
    description: 'Codes promo associés',
    example: ['PRINTEMPS2026'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  codesPromo?: string[];

  @ApiPropertyOptional({
    description: 'Durée minimum de location en jours',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  dureeMinLocation?: number;

  @ApiPropertyOptional({
    description: 'Montant minimum de commande',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  montantMinCommande?: number;
}
