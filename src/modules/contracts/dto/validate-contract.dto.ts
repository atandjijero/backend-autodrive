import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateContractDto {
  @ApiProperty({
    description: 'Valider (true) ou rejeter (false) le contrat',
    example: true,
    type: Boolean,
  })
  @IsBoolean()
  valider: boolean;

  @ApiProperty({
    description: 'Commentaires optionnels (notamment en cas de rejet)',
    example: 'Contrat approuvé',
    required: false,
  })
  @IsOptional()
  @IsString()
  commentaires?: string;
}
