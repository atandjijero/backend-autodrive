import { Module } from '@nestjs/common';
import { DashboardController } from 'src/modules/dashboard/controllers/dashboard.controller';
import { DashboardService } from 'src/modules/dashboard/services/dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
