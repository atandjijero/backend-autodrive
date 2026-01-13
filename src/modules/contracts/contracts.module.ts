import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailModule } from '../../shared/mail.module';
import { AgenciesModule } from '../agencies/agencies.module';
import { ContractsController } from './controllers/contracts.controller';
import { ContractsService } from './services/contracts.service';
import { Contract, ContractSchema } from './schemas/contract.schema';
import { Vehicle, VehicleSchema } from '../vehicules/schemas/vehicule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
      { name: Vehicle.name, schema: VehicleSchema },
    ]),
    MailModule,
    AgenciesModule,
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}