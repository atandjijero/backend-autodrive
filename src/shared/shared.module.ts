import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { CloudinaryService } from './cloudinary.service';
import { AgenciesModule } from '../modules/agencies/agencies.module';

@Module({
  imports: [ConfigModule, AgenciesModule],
  providers: [MailService, CloudinaryService],
  exports: [MailService, CloudinaryService],
})
export class SharedModule {}