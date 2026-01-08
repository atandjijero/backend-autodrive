import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class LocationDto {
  @ApiProperty({ description: 'Latitude (-90 à 90)', example: 48.8566, type: Number })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Latitude doit être un nombre valide' })
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude (-180 à 180)', example: 2.3522, type: Number })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Longitude doit être un nombre valide' })
  @Min(-180)
  @Max(180)
  longitude: number;
}
