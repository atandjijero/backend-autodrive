import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
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
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI') || 'mongodb://localhost:27017/autodrive',
      }),
    }),
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
