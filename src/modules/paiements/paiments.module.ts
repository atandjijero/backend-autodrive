import { Module } from '@nestjs/common';
import { PaiementsController } from 'src/modules/paiements/controllers/paiements.controller';
import { PaiementsService } from 'src/modules/paiements/services/paiements.service';
import { MailModule } from 'src/shared/mail.module';
import { PromotionsModule } from 'src/modules/promotions/promotions.module';

@Module({
  imports: [
    MailModule,
    PromotionsModule,
  ],
  controllers: [PaiementsController],
  providers: [PaiementsService],
})
export class PaiementsModule {}
