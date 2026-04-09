import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma.service';
import { StatutPromotion } from '@prisma/client';

@Injectable()
export class PromotionsSchedulerService {
  private readonly logger = new Logger(PromotionsSchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredPromotions() {
    try {
      const now = new Date();

      const expiredPromotions = await this.prisma.promotion.findMany({
        where: {
          statut: StatutPromotion.active,
          dateFin: { lt: now },
          deleted: false,
        },
      });

      if (expiredPromotions.length === 0) {
        this.logger.log('Aucune promotion expirée trouvée');
        return;
      }

      const result = await this.prisma.promotion.updateMany({
        where: {
          statut: StatutPromotion.active,
          dateFin: { lt: now },
          deleted: false,
        },
        data: { statut: StatutPromotion.inactive },
      });

      this.logger.log(`${result.count} promotions marquées comme inactives`);

      // Log des promotions expirées pour le suivi
      expiredPromotions.forEach(promotion => {
        this.logger.log(`Promotion "${promotion.titre}" expirée (dateFin: ${promotion.dateFin})`);
      });

    } catch (error) {
      this.logger.error('Erreur lors de la vérification des promotions expirées:', error);
    }
  }
}