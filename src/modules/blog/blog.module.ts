import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogService } from './services/blog.service';
import { BlogController } from './controllers/blog.controller';
import { Post, PostSchema } from './schemas/post.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }])],
  providers: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
