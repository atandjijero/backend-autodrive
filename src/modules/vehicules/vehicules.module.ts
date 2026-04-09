import { Module } from '@nestjs/common';
import { VehiclesController } from 'src/modules/vehicules/controllers/vehicules.controller';
import { VehiclesService } from 'src/modules/vehicules/services/vehicucles.service';
import { AgenciesModule } from '../agencies/agencies.module';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [
    AgenciesModule,
    SharedModule,
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService], 
})
export class VehiculesModule {}

