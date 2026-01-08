import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LocationDto } from './location.dto';
import { Transform } from 'class-transformer';

export class UpdateAgencyDto {
  @ApiPropertyOptional({ description: 'Nom de l\'agence', example: 'Agence Paris Centre' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Adresse de l\'agence', example: '123 Rue de la Paix' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Ville de l\'agence', example: 'Paris' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Code postal', example: '75001' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Pays', example: 'France' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Numéro de téléphone', example: '+33123456789' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Adresse email', example: 'contact@agence-paris.fr' })
  @IsOptional()
  @IsEmail()
  email?: string;

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