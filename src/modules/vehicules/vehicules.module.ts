import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VehiclesController } from 'src/modules/vehicules/controllers/vehicules.controller';
import { VehiclesService } from 'src/modules/vehicules/services/vehicucles.service';
import { Vehicle, VehicleSchema } from './schemas/vehicule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
    ]),
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService], 
})
export class VehiculesModule {}
