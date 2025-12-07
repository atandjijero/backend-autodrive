import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReservationService } from 'src/modules/reservations/services/reservation.service';
import { CreateReservationDto } from 'src/modules/reservations/dto/create-reservation.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import type { Response } from 'express';
import { PdfService } from 'src/modules/reservations/services/pdf.service';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation } from '../schema/reservation.schema';

@ApiTags('reservations')
@ApiBearerAuth()
@Controller('reservations')
export class ReservationController {
  constructor(
    private readonly reservationService: ReservationService,
    private readonly pdfService: PdfService,

    // Injection du modèle Mongoose
    @InjectModel(Reservation.name)
    private readonly reservationModel: Model<Reservation>,
  ) {}

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

  //  Génération du PDF
 // @UseGuards(JwtAuthGuard)
@Get(':id/recu')
async getRecuPdf(@Param('id') id: string, @Res() res: Response) {
  const reservation = await this.reservationModel
    .findById(id)
    .populate('vehicleId')
    .populate('clientId')
    .exec();

  if (!reservation) {
    throw new NotFoundException('Réservation introuvable');
  }

  const pdfBuffer = await this.pdfService.generateReservationReceipt(reservation);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename=recu-${reservation.numeroReservation}.pdf`,
    'Content-Length': pdfBuffer.length,
  });

  res.end(pdfBuffer);
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
