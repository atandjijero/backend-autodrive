import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: 'jean.dupont@example.com', description: 'Adresse email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: 'Code OTP reçu par email' })
  @IsString()
  otp: string;
}
