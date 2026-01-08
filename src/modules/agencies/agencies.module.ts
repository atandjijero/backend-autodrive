import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgenciesService } from './services/agencies.service';
import { AgenciesController } from './controllers/agencies.controller';
import { AgenciesPublicController } from './controllers/agencies-public.controller';
import { Agency, AgencySchema } from './schemas/agency.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Agency.name, schema: AgencySchema }])],
  providers: [AgenciesService],
  controllers: [AgenciesController, AgenciesPublicController],
})
export class AgenciesModule {}