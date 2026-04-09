import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { VehiculesModule } from './modules/vehicules/vehicules.module';
import { ReservationModule } from './modules/reservations/reservation.module';
import { PaiementsModule } from './modules/paiements/paiments.module';
import { StatsModule } from './modules/clients/stats/stats.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { ContactModule } from './modules/contact/contact.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BlogModule } from './modules/blog/blog.module';
import { AgenciesModule } from './modules/agencies/agencies.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { UploadModule } from './modules/upload/upload.module';
import { PrismaModule } from './shared/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    VehiculesModule,
    ReservationModule,
    PaiementsModule,
    StatsModule,
    DashboardModule,
    PromotionsModule,
    ContactModule,
    NotificationsModule,
    BlogModule,
    AgenciesModule,
    ContractsModule,
    UploadModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

