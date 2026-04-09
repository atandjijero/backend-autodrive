import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { PostStatus } from '@prisma/client';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePostDto) {
    console.log('Creating post with DTO:', dto);
    const post = await this.prisma.post.create({
      data: {
        title: dto.title,
        content: dto.body,
        slug: dto.slug,
        excerpt: dto.excerpt,
        author: dto.author,
        status: dto.status as PostStatus || PostStatus.draft,
        tags: dto.tags || [],
        publishedAt: dto.publishedAt,
        featuredImage: dto.featuredImage,
      },
    });
    console.log('Saved post:', post);
    return post;
  }

  async update(id: string, dto: UpdatePostDto) {
    try {
      const post = await this.prisma.post.update({
        where: { id: parseInt(id) },
        data: {
          title: dto.title,
          content: dto.body,
          slug: dto.slug,
          excerpt: dto.excerpt,
          author: dto.author,
          status: dto.status as PostStatus,
          tags: dto.tags,
          publishedAt: dto.publishedAt,
          featuredImage: dto.featuredImage,
        },
      });
      return post;
    } catch (error) {
      throw new NotFoundException('Post not found');
    }
  }

  async delete(id: string) {
    try {
      await this.prisma.post.delete({
        where: { id: parseInt(id) },
      });
      return { success: true };
    } catch (error) {
      throw new NotFoundException('Post not found');
    }
  }

  async findBySlug(slug: string) {
    return this.prisma.post.findUnique({
      where: { slug },
    });
  }

  async findById(id: string) {
    return this.prisma.post.findUnique({
      where: { id: parseInt(id) },
    });
  }

  async publish(id: string, publish = true) {
    try {
      const post = await this.prisma.post.update({
        where: { id: parseInt(id) },
        data: {
          status: publish ? PostStatus.published : PostStatus.draft,
          publishedAt: publish ? new Date() : null,
        },
      });
      return post;
    } catch (error) {
      throw new NotFoundException('Post not found');
    }
  }

  async list(opts: { page?: number; limit?: number; q?: string; tags?: string[]; status?: string; admin?: boolean }) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.max(1, Math.min(100, opts.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (opts.status) where.status = opts.status;
    if (!opts.admin && !where.status) where.status = PostStatus.published;
    if (opts.tags && opts.tags.length) {
      where.tags = {
        hasSome: opts.tags,
      };
    }

    if (opts.q) {
      // For PostgreSQL, we can use ILIKE for case-insensitive search
      where.OR = [
        { title: { contains: opts.q, mode: 'insensitive' } },
        { content: { contains: opts.q, mode: 'insensitive' } },
        { excerpt: { contains: opts.q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
