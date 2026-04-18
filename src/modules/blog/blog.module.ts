import { Module } from '@nestjs/common';
import { BlogService } from './services/blog.service';
import { BlogController } from './controllers/blog.controller';
import { CloudinaryModule } from '../../shared/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  providers: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
