import { Module } from '@nestjs/common';
import { PromotionsController } from 'src/modules/promotions/controllers/promotions.controller';
import { PromotionsService } from 'src/modules/promotions/services/promotions.service';
import { PromotionsSchedulerService } from 'src/modules/promotions/services/promotions-scheduler.service';

@Module({
  imports: [],
  controllers: [PromotionsController],
  providers: [PromotionsService, PromotionsSchedulerService],
  exports: [PromotionsService],
})
export class PromotionsModule {}