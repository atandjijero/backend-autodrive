import { IsEmail, IsString, MinLength, IsOptional, IsEnum, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({ example: 'Jean', description: 'Nom de famille' })
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  nom: string;

  @ApiProperty({ example: 'Dupont', description: 'Prénom' })
  @IsString()
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
  prenom: string;

  @ApiProperty({ example: 'jean.dupont@example.com', description: 'Adresse email unique' })
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Mot de passe (min 6 caractères)' })
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  motPasse: string;

  @ApiProperty({ example: '+22890123456', description: 'Téléphone principal' })
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'Numéro de téléphone invalide' })
  telephone: string;

  @ApiProperty({ example: '+22892123456', description: 'Téléphone secondaire', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'Numéro de téléphone invalide' })
  telephoneSecondaire?: string;

  @ApiProperty({ example: 'Rue des fleurs, Lomé', description: 'Adresse complète', required: false })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiProperty({ enum: Role, example: Role.Client, description: 'Rôle utilisateur (par défaut Client)' })
  @IsOptional()
  @IsEnum(Role, { message: 'Rôle invalide' })
  role?: Role;
}
