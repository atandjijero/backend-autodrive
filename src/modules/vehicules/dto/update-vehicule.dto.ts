import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleDto } from './create-vehicule.dto';
import { IsOptional, IsArray, IsString } from 'class-validator';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}
