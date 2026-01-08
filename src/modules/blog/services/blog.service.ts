import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from '../schemas/post.schema';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';

@Injectable()
export class BlogService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async create(dto: CreatePostDto) {
    console.log('Creating post with DTO:', dto);
    const created = new this.postModel(dto as any);
    const saved = await created.save();
    console.log('Saved post:', saved);
    return saved;
  }

  async update(id: string, dto: UpdatePostDto) {
    const updated = await this.postModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!updated) throw new NotFoundException('Post not found');
    return updated;
  }

  async delete(id: string) {
    const res = await this.postModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Post not found');
    return { success: true };
  }

  async findBySlug(slug: string) {
    return this.postModel.findOne({ slug }).exec();
  }

  async findById(id: string) {
    return this.postModel.findById(id).exec();
  }

  async publish(id: string, publish = true) {
    const update: any = { status: publish ? 'published' : 'draft' };
    if (publish) update.publishedAt = new Date();
    const post = await this.postModel.findByIdAndUpdate(id, update, { new: true }).exec();
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async list(opts: { page?: number; limit?: number; q?: string; tags?: string[]; status?: string; admin?: boolean }) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.max(1, Math.min(100, opts.limit || 10));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (opts.status) filter.status = opts.status;
    if (!opts.admin && !filter.status) filter.status = 'published';
    if (opts.tags && opts.tags.length) filter.tags = { $all: opts.tags };

    let query = this.postModel.find(filter);

    if (opts.q) {
      // Try text search then fallback to regex
      query = this.postModel.find({ $and: [filter, { $text: { $search: opts.q } }] });
    }

    const [data, total] = await Promise.all([
      query.sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.postModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }
}
