import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as ms from 'ms'; 

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { User, UserSchema } from './schemas/user.schema';
import { MailModule } from '../shared/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<JwtModuleOptions> => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET manquant dans .env');

        return {
          secret,
          signOptions: {
            //  accepte soit un nombre (3600) soit une chaîne ('7d')
            expiresIn: (configService.get<string>('JWT_EXPIRES_IN') as ms.StringValue) ?? '7d',
          },
        };
      },
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MailModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
