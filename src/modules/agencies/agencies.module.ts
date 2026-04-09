import { Module } from '@nestjs/common';
import { AgenciesService } from './services/agencies.service';
import { AgenciesController } from './controllers/agencies.controller';
import { AgenciesPublicController } from './controllers/agencies-public.controller';

@Module({
  imports: [],
  providers: [AgenciesService],
  controllers: [AgenciesController, AgenciesPublicController],
  exports: [AgenciesService],
})
export class AgenciesModule {}