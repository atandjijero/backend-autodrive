import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getClientStats() {
    // Total clients (tous sauf admin)
    const totalClients = await this.prisma.user.count({
      where: {
        role: { not: Role.admin },
        deleted: false,
      },
    });

    // Total par rôle
    const totalClientsByRole = {
      client: await this.prisma.user.count({
        where: { role: Role.client, deleted: false },
      }),
      entreprise: await this.prisma.user.count({
        where: { role: Role.entreprise, deleted: false },
      }),
      tourist: await this.prisma.user.count({
        where: { role: Role.tourist, deleted: false },
      }),
    };

    // Clients ayant fait au moins une réservation
    const clientsWithReservationsResult = await this.prisma.reservation.findMany({
      select: { clientId: true },
      distinct: ['clientId'],
    });
    const clientsWithReservations = clientsWithReservationsResult.length;

    // Clients ayant effectué un paiement (via réservations)
    const clientsWithPaymentsResult = await this.prisma.paiement.findMany({
      select: { reservation: { select: { clientId: true } } },
      distinct: ['reservationId'],
    });
    const clientsWithPayments = new Set(
      clientsWithPaymentsResult
        .map(p => p.reservation?.clientId)
        .filter(Boolean)
    ).size;

    return {
      totalClients,
      totalClientsByRole,
      clientsWithReservations,
      clientsWithPayments,
    };
  }
}
