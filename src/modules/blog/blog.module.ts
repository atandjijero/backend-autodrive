import { Module } from '@nestjs/common';
import { BlogService } from './services/blog.service';
import { BlogController } from './controllers/blog.controller';

@Module({
  providers: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
