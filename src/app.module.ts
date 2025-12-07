import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { VehiculesModule } from './modules/vehicules/vehicules.module';
import { ReservationModule } from './modules/reservations/reservation.module';
import { PaiementsModule } from './modules/paiements/paiments.module';
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
