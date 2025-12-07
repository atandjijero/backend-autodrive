import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';

import { User, UserSchema } from 'src/auth/schemas/user.schema';
import { Reservation, ReservationSchema } from 'src/modules/reservations/schema/reservation.schema';
import { Paiement, PaiementSchema } from 'src/modules/paiements/schemas/paiement.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Reservation.name, schema: ReservationSchema },
      { name: Paiement.name, schema: PaiementSchema },
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
