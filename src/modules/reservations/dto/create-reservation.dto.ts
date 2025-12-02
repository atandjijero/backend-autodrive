import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsDateString } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({
    description: 'Identifiant du véhicule à réserver',
    example: '656f8c123abc456def789012',
  })
  @IsMongoId()
  vehicleId: string;

  @ApiProperty({
    description: 'Identifiant du client qui fait la réservation',
    example: '6570ab123abc456def789999',
  })
  @IsMongoId()
  clientId: string;

  @ApiProperty({
    description: 'Date de début de la réservation (format ISO)',
    example: '2025-12-02',
  })
  @IsDateString()
  dateDebut: string;

  @ApiProperty({
    description: 'Date de fin de la réservation (format ISO)',
    example: '2025-12-05',
  })
  @IsDateString()
  dateFin: string;
}
