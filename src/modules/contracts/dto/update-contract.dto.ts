import { IsOptional, IsEnum, IsString, IsNumber, Min, IsDate, IsMongoId, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContractStatus } from '../schemas/contract.schema';

export class UpdateContractDto {
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
    description: 'Statut du contrat',
    enum: ContractStatus,
    example: ContractStatus.Approved,
    required: false
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  statut?: ContractStatus;

  @ApiProperty({
    description: 'Commentaires de l\'admin',
    example: 'Contrat validé après vérification',
    required: false
  })
  @IsOptional()
  @IsString()
  commentaires?: string;

  @ApiProperty({
    description: 'Montant total du contrat',
    example: 500,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  montantTotal?: number;

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

  @ApiProperty({
    description: 'Date de validation par l\'admin',
    example: '2024-01-01T12:00:00.000Z',
    required: false
  })
  @IsOptional()
  @IsDate()
  dateValidation?: Date;

  @ApiProperty({
    description: 'ID de l\'admin qui a validé',
    example: '507f1f77bcf86cd799439011',
    required: false
  })
  @IsOptional()
  @IsMongoId()
  validePar?: string;
}