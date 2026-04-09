import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({
    description: 'Identifiant du véhicule à réserver',
    example: 123,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  vehicleId!: number;

  @ApiProperty({
    description: 'Identifiant du client qui fait la réservation',
    example: 456,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  clientId!: number;

  @ApiProperty({
    description: 'Date de début de la réservation (format ISO)',
    example: '2025-12-02',
  })
  @IsDateString()
  dateDebut!: string;

  @ApiProperty({
    description: 'Date de fin de la réservation (format ISO)',
    example: '2025-12-05',
  })
  @IsDateString()
  dateFin!: string;

  @ApiProperty({
    description: 'Code promo à appliquer (optionnel)',
    example: 'HIVER2026',
    required: false,
  })
  @IsOptional()
  @IsString()
  codePromo?: string;
}
