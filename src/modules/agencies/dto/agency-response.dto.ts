import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AgencyResponseDto {
  @ApiProperty({ description: 'ID unique de l\'agence', example: '507f1f77bcf86cd799439011' })
  @Expose()
  _id: string;

  @ApiProperty({ description: 'Nom de l\'agence', example: 'Agence Paris Centre' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Adresse de l\'agence', example: '123 Rue de la Paix' })
  @Expose()
  address: string;

  @ApiProperty({ description: 'Ville de l\'agence', example: 'Paris' })
  @Expose()
  city: string;

  @ApiProperty({ description: 'Code postal', example: '75001' })
  @Expose()
  postalCode: string;

  @ApiProperty({ description: 'Pays', example: 'France' })
  @Expose()
  country: string;

  @ApiProperty({ description: 'Numéro de téléphone', example: '+33123456789' })
  @Expose()
  phone: string;

  @ApiProperty({ description: 'Adresse email', example: 'contact@agence-paris.fr' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Nom du responsable', example: 'Jean Dupont', required: false })
  @Expose()
  manager?: string;

  @ApiProperty({ description: 'Description de l\'agence', example: 'Agence principale de Paris', required: false })
  @Expose()
  description?: string;

  @ApiProperty({ description: 'Nom du fichier logo', example: '1640995200000-logo.png', required: false })
  @Expose()
  logo?: string;

  @ApiProperty({
    description: 'Coordonnées GPS de l\'agence',
    example: { latitude: 48.8566, longitude: 2.3522 },
    required: false
  })
  @Expose()
  location?: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty({ description: 'Statut actif de l\'agence', example: true })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Date de création', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière modification', example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}