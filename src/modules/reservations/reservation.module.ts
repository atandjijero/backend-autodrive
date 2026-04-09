import { Module } from '@nestjs/common';
import { ReservationService } from 'src/modules/reservations/services/reservation.service';
import { ReservationController } from 'src/modules/reservations/controllers/reservation.controller';
import { PdfModule } from 'src/modules/reservations/pdf.module';
import { PromotionsModule } from 'src/modules/promotions/promotions.module';

@Module({
  imports: [
    PdfModule,
    PromotionsModule,
  ],
  providers: [ReservationService],
  controllers: [ReservationController],
  exports: [ReservationService],
})
export class ReservationModule {}

