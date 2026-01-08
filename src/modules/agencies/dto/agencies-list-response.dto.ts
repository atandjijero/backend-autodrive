import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AgencyResponseDto } from './agency-response.dto';

export class AgenciesListResponseDto {
  @ApiProperty({ description: 'Liste des agences', type: [AgencyResponseDto] })
  @Expose()
  @Type(() => AgencyResponseDto)
  data: AgencyResponseDto[];

  @ApiProperty({ description: 'Nombre total d\'agences', example: 25 })
  @Expose()
  total: number;

  @ApiProperty({ description: 'Numéro de page actuel', example: 1 })
  @Expose()
  page: number;

  @ApiProperty({ description: 'Nombre d\'éléments par page', example: 10 })
  @Expose()
  limit: number;
}