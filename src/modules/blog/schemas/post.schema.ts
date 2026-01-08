import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  body: string;

  @Prop()
  excerpt?: string;

  @Prop()
  author?: string;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ enum: ['draft', 'published'], default: 'draft' })
  status: 'draft' | 'published';

  @Prop()
  publishedAt?: Date;

  @Prop()
  featuredImage?: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.index({ title: 'text', body: 'text' });

export { Post as PostModel };
