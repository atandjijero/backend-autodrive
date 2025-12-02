import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Reservation, ReservationSchema } from 'src/modules/reservations/schema/reservation.schema';
import { Vehicle, VehicleSchema } from 'src/modules/vehicules/schemas/vehicule.schema';
import { ReservationService } from 'src/modules/reservations/services/reservation.service';
import { ReservationController } from 'src/modules/reservations/controllers/reservation.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
      { name: Vehicle.name, schema: VehicleSchema },
    ]),
  ],
  providers: [ReservationService],
  controllers: [ReservationController],
})
export class ReservationModule {}
