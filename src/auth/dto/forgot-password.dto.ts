import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'jean.dupont@example.com', description: 'Adresse email pour réinitialisation' })
  @IsEmail()
  email: string;
}
