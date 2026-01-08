import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationDto } from './location.dto';
import { Transform } from 'class-transformer';

export class CreateAgencyDto {
  @ApiProperty({ description: 'Nom de l\'agence', example: 'Agence Paris Centre' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Adresse de l\'agence', example: '123 Rue de la Paix' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'Ville de l\'agence', example: 'Paris' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'Code postal', example: '75001' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ description: 'Pays', example: 'France' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ description: 'Numéro de téléphone', example: '+33123456789' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Adresse email', example: 'contact@agence-paris.fr' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'Nom du responsable', example: 'Jean Dupont' })
  @IsOptional()
  @IsString()
  manager?: string;

  @ApiPropertyOptional({ description: 'Description de l\'agence', example: 'Agence principale de Paris' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Logo de l\'agence (upload de fichier)', type: 'string', format: 'binary' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({
    description: 'Coordonnées GPS de l\'agence',
    type: 'object',
    properties: {
      latitude: {
        type: 'number',
        description: 'Latitude (-90 à 90)',
        example: 48.8566
      },
      longitude: {
        type: 'number',
        description: 'Longitude (-180 à 180)',
        example: 2.3522
      }
    }
  })
  @IsOptional()
  location?: LocationDto;

  @ApiPropertyOptional({ description: 'Statut actif de l\'agence', example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}