import { IsNotEmpty, IsDateString, IsNumber, Min, IsOptional, IsString, IsMongoId, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContractDto {
  @ApiProperty({
    description: 'ID du véhicule',
    example: '507f1f77bcf86cd799439011',
    required: false
  })
  @IsOptional()
  @ValidateIf((o) => o.vehicleId !== undefined && o.vehicleId !== null && o.vehicleId !== '')
  @IsMongoId()
  vehicleId?: string;

  @ApiProperty({
    description: 'Date de début de location',
    example: '2024-01-15'
  })
  @IsNotEmpty()
  @IsDateString()
  dateDebut: string;

  @ApiProperty({
    description: 'Date de fin de location',
    example: '2024-01-20'
  })
  @IsNotEmpty()
  @IsDateString()
  dateFin: string;

  @ApiProperty({
    description: 'Montant total du contrat',
    example: 500
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  montantTotal: number;

  @ApiProperty({
    description: 'Acompte versé',
    example: 100,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  acompteVerse?: number;

  @ApiProperty({
    description: 'Conditions spéciales',
    example: 'Kilométrage illimité',
    required: false
  })
  @IsOptional()
  @IsString()
  conditionsSpeciales?: string;
}