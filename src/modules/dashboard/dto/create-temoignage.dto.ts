import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTemoignageDto {
  @ApiProperty({
    description: 'Message du témoignage',
    example: 'Super service, je recommande vivement !',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message!: string;
}
