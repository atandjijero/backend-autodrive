import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import {
  Reservation,
  StatutReservation,
} from '@prisma/client';
import { CreateReservationDto } from 'src/modules/reservations/dto/create-reservation.dto';
import { PromotionsService } from 'src/modules/promotions/services/promotions.service';

@Injectable()
export class ReservationService {
  constructor(
    private prisma: PrismaService,
    private promotionsService: PromotionsService,
  ) { }

  private generateReservationNumber(): string {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `RES-${date}-${random}`;
  }

  private async checkAndUpdateStatus(reservation: Reservation) {
    const now = new Date();

    if (
      reservation.statut === StatutReservation.en_cours &&
      reservation.dateFin < now
    ) {
      const updated = await this.prisma.reservation.update({
        where: { id: reservation.id },
        data: { statut: StatutReservation.terminee },
      });

      // Libérer le véhicule
      await this.prisma.vehicle.update({
        where: { id: reservation.vehicleId },
        data: { disponible: true },
      });
      return updated;
    }

    return reservation;
  }

  async create(data: CreateReservationDto): Promise<Reservation> {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
      if (!vehicle || vehicle.deleted || !vehicle.disponible) {
        throw new BadRequestException('Véhicule non disponible');
      }

      const overlap = await this.prisma.reservation.findFirst({
        where: {
          vehicleId: vehicle.id,
          statut: { in: [StatutReservation.en_attente, StatutReservation.validee, StatutReservation.en_cours] },
          OR: [
            { dateDebut: { lte: new Date(data.dateFin) }, dateFin: { gte: new Date(data.dateDebut) } },
          ],
        },
      });

      if (overlap) {
        throw new BadRequestException(
          'Le véhicule est déjà réservé sur cette période',
        );
      }

      const numeroReservation = this.generateReservationNumber();

      let promotionId: number | undefined;
      if (data.codePromo) {
        const promotion = await this.promotionsService.findByCode(data.codePromo);
        if (!promotion) {
          throw new BadRequestException('Code promo invalide ou expiré');
        }
        promotionId = promotion.id;
      }

      const reservation = await this.prisma.reservation.create({
        data: {
          vehicleId: vehicle.id,
          clientId: data.clientId,
          dateDebut: new Date(data.dateDebut),
          dateFin: new Date(data.dateFin),
          statut: StatutReservation.en_attente,
          numeroReservation,
          promotionId,
        },
      });

      await this.prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { disponible: false },
      });

      return reservation;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        `Erreur lors de la création de la réservation: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<Reservation[]> {
    try {
      const reservations = await this.prisma.reservation.findMany({
        include: {
          vehicle: true,
          client: true,
          promotion: true,
        },
      });

      return Promise.all(reservations.map(r => this.checkAndUpdateStatus(r)));
    } catch (error) {
      throw new InternalServerErrorException(
        `Erreur lors de la récupération des réservations: ${error.message}`,
      );
    }
  }

  async findById(id: number): Promise<Reservation> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        vehicle: true,
        client: true,
        promotion: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Réservation non trouvée');
    }

    return this.checkAndUpdateStatus(reservation);
  }

  async updateStatut(id: number, statut: StatutReservation): Promise<Reservation> {
    const reservation = await this.prisma.reservation.update({
      where: { id },
      data: { statut },
    });

    if (
      statut === StatutReservation.terminee ||
      statut === StatutReservation.annulee
    ) {
      await this.prisma.vehicle.update({
        where: { id: reservation.vehicleId },
        data: { disponible: true },
      });
    }

    return reservation;
  }

  async delete(id: number): Promise<Reservation> {
    const reservation = await this.prisma.reservation.delete({ where: { id } });
    
    await this.prisma.vehicle.update({
      where: { id: reservation.vehicleId },
      data: { disponible: true },
    });

    return reservation;
  }
}

