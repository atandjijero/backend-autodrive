import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Res,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReservationService } from 'src/modules/reservations/services/reservation.service';
import { CreateReservationDto } from 'src/modules/reservations/dto/create-reservation.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import type { Response } from 'express';
import { PdfService } from 'src/modules/reservations/services/pdf.service';
import { StatutReservation } from '@prisma/client';

@ApiTags('reservations')
@ApiBearerAuth()
@Controller('reservations')
export class ReservationController {
  constructor(
    private readonly reservationService: ReservationService,
    private readonly pdfService: PdfService,
  ) { }

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
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.reservationService.findById(id);
  }

  @Get(':id/recu')
  async getRecuPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const reservation = await this.reservationService.findById(id);

    if (!reservation) {
      throw new NotFoundException('Réservation introuvable');
    }

    const pdfBuffer = await this.pdfService.generateReservationReceipt(reservation as any);

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
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.reservationService.delete(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une réservation (Validation Admin)' })
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body('statut') statut: StatutReservation) {
    return this.reservationService.updateStatut(id, statut);
  }
}

