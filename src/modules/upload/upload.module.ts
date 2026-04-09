import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { UploadController } from './controllers/upload.controller';

@Module({
  imports: [SharedModule],
  controllers: [UploadController],
})
export class UploadModule {}