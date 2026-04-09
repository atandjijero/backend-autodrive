import { IsEmail, IsString, IsOptional, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jean', description: 'Nom de famille' })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({ example: 'Dupont', description: 'Prénom' })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiPropertyOptional({ example: 'jean.dupont@example.com', description: 'Adresse email' })
  @IsOptional()
  @IsEmail({}, { message: 'Adresse email invalide' })
  email?: string;

  @ApiPropertyOptional({ example: '+22890123456', description: 'Téléphone principal' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+]{8,15}$/, { message: 'Numéro de téléphone invalide' })
  telephone?: string;

  @ApiPropertyOptional({ example: '+22892123456', description: 'Téléphone secondaire' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+]{8,15}$/, { message: 'Numéro de téléphone invalide' })
  telephoneSecondaire?: string;

  @ApiPropertyOptional({ example: 'Rue des fleurs, Lomé', description: 'Adresse complète' })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional({ description: 'URL de la photo de profil', example: 'https://res.cloudinary.com/...' })
  @IsOptional()
  @IsString()
  photo?: string;
}
