import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'abcdef1234567890', description: 'Token reçu par email' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'Nouveau mot de passe' })
  @IsString()
  @MinLength(6)
  newPassword: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'Confirmation du nouveau mot de passe' })
  @IsString()
  confirmPassword: string;
}
