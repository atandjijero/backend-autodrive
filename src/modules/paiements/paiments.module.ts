import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaiementsController } from 'src/modules/paiements/controllers/paiements.controller';
import { PaiementsService } from 'src/modules/paiements/services/paiements.service';
import { Paiement, PaiementSchema } from './schemas/paiement.schema';
import { Reservation, ReservationSchema } from 'src/modules/reservations/schema/reservation.schema';
import { MailModule } from 'src/shared/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Paiement.name, schema: PaiementSchema },
      { name: Reservation.name, schema: ReservationSchema }, 
    ]),
    MailModule,
  ],
  controllers: [PaiementsController],
  providers: [PaiementsService],
})
export class PaiementsModule {}
