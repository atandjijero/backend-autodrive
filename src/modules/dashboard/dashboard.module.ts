import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from 'src/modules/dashboard/controllers/dashboard.controller';
import { DashboardService } from 'src/modules/dashboard/services/dashboard.service';
import { User, UserSchema } from 'src/auth/schemas/user.schema';
import { Reservation, ReservationSchema } from 'src/modules/reservations/schema/reservation.schema';
import { Paiement, PaiementSchema } from 'src/modules/paiements/schemas/paiement.schema';
import { Promotion, PromotionSchema } from 'src/modules/promotions/schemas/promotion.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Reservation.name, schema: ReservationSchema },
      { name: Paiement.name, schema: PaiementSchema },
      { name: Promotion.name, schema: PromotionSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
