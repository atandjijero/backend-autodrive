import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'jean.dupont@example.com', description: 'Adresse email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Mot de passe' })
  @IsString()
  motPasse: string;
}
