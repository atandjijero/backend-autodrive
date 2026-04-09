import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { CreateTemoignageDto } from '../dto/create-temoignage.dto';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: parseInt(userId), deleted: false },
      });
      if (!user) throw new NotFoundException('Utilisateur introuvable');

      const reservations = await this.prisma.reservation.findMany({
        where: { clientId: parseInt(userId) },
        include: {
          vehicle: true,
          promotion: true,
        },
      });

      const reservationIds = reservations.map(r => r.id);

      const paiements = await this.prisma.paiement.findMany({
        where: {
          reservationId: { in: reservationIds },
        },
        include: {
          reservation: {
            include: {
              promotion: true,
            },
          },
        },
      });

      // Get unique promotion IDs from reservations and payments
      const promotionIds = [
        ...new Set([
          ...reservations.map(r => r.promotionId).filter(Boolean),
          ...paiements.map(p => p.reservation?.promotionId).filter(Boolean),
        ].filter(Boolean) as number[])
      ];

      const promotions = promotionIds.length > 0
        ? await this.prisma.promotion.findMany({
            where: { id: { in: promotionIds } },
          })
        : [];

      return {
        profil: {
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role,
        },
        reservations,
        paiements,
        promotions,
        temoignages: user.temoignages ?? [],
      };
    } catch (err) {
      console.error('Erreur getDashboard:', err);
      throw new InternalServerErrorException('Erreur serveur lors de la récupération du dashboard');
    }
  }

  async addTemoignage(userId: string, dto: CreateTemoignageDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          temoignages: {
            push: dto.message,
          },
        },
      });
      return user.temoignages;
    } catch (error) {
      throw new NotFoundException('Utilisateur introuvable');
    }
  }

  async deleteTemoignage(userId: string, message: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(userId), deleted: false },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const updatedTemoignages = (user.temoignages ?? []).filter(t => t !== message);
    await this.prisma.user.update({
      where: { id: parseInt(userId) },
      data: { temoignages: updatedTemoignages },
    });
    return updatedTemoignages;
  }

  async getTemoignages(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });
    if (!user || user.deleted) throw new NotFoundException('Utilisateur introuvable');

    return (user.temoignages ?? []).map(message => ({
      nom: user.nom,
      prenom: user.prenom,
      message,
    }));
  }

  async getAllTemoignages() {
    const users = await this.prisma.user.findMany({
      where: { deleted: false },
      select: { nom: true, prenom: true, temoignages: true },
    });
    const allTemoignages: { nom: string; prenom: string; message: string }[] = [];

    for (const user of users) {
      if (user.temoignages && Array.isArray(user.temoignages)) {
        for (const message of user.temoignages) {
          if (message && message.trim()) {
            allTemoignages.push({
              nom: user.nom,
              prenom: user.prenom,
              message,
            });
          }
        }
      }
    }
    return allTemoignages;
  }

}