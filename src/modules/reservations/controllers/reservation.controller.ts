import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags,ApiBearerAuth } from '@nestjs/swagger';
import { ReservationService } from 'src/modules/reservations/services/reservation.service';
import { CreateReservationDto } from 'src/modules/reservations/dto/create-reservation.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@ApiTags('reservations')
@ApiBearerAuth()
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Créer une réservation',
    description:
      'Un utilisateur connecté peut réserver un véhicule. La validation est automatique si le véhicule est disponible.',
  })
  async create(@Body() data: CreateReservationDto) {
    return this.reservationService.create(data);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  @ApiOperation({
    summary: 'Lister toutes les réservations',
    description: 'Accessible uniquement aux administrateurs.',
  })
  async findAll() {
    return this.reservationService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Consulter une réservation par ID',
    description: 'Accessible à tout utilisateur connecté.',
  })
  async findById(@Param('id') id: string) {
    return this.reservationService.findById(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer une réservation',
    description:
      'Accessible uniquement aux administrateurs. Supprime une réservation et rend le véhicule disponible.',
  })
  async delete(@Param('id') id: string) {
    return this.reservationService.delete(id);
  }
}
