import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Promotion, PromotionDocument, StatutPromotion } from '../schemas/promotion.schema';

@Injectable()
export class PromotionsSchedulerService {
  private readonly logger = new Logger(PromotionsSchedulerService.name);

  constructor(
    @InjectModel(Promotion.name)
    private promotionModel: Model<PromotionDocument>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredPromotions() {
    try {
      const now = new Date();

      // Trouver toutes les promotions actives dont la date de fin est dépassée
      const expiredPromotions = await this.promotionModel.find({
        statut: StatutPromotion.Active,
        dateFin: { $lt: now },
        deleted: false,
      });

      if (expiredPromotions.length === 0) {
        this.logger.log('Aucune promotion expirée trouvée');
        return;
      }

      // Mettre à jour le statut des promotions expirées
      const result = await this.promotionModel.updateMany(
        {
          statut: StatutPromotion.Active,
          dateFin: { $lt: now },
          deleted: false,
        },
        { $set: { statut: StatutPromotion.Inactive } }
      );

      this.logger.log(`${result.modifiedCount} promotions marquées comme inactives`);

      // Log des promotions expirées pour le suivi
      expiredPromotions.forEach(promotion => {
        this.logger.log(`Promotion "${promotion.titre}" expirée (dateFin: ${promotion.dateFin})`);
      });

    } catch (error) {
      this.logger.error('Erreur lors de la vérification des promotions expirées:', error);
    }
  }
}