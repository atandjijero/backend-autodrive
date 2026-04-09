import { Module } from '@nestjs/common';
import { MailModule } from '../../shared/mail.module';
import { AgenciesModule } from '../agencies/agencies.module';
import { ReservationModule } from '../reservations/reservation.module';
import { ContractsController } from './controllers/contracts.controller';
import { ContractsService } from './services/contracts.service';

@Module({
  imports: [
    MailModule,
    AgenciesModule,
    ReservationModule,
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}