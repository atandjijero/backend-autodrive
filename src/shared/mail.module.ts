import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { AgenciesModule } from '../modules/agencies/agencies.module';

@Module({
  imports: [AgenciesModule],
  providers: [MailService],
  exports: [MailService], 
})
export class MailModule {}
