import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BlogService } from '../services/blog.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { AdminGuard } from '../../../auth/guards/admin.guard';
import { storage, imageFileFilter } from '../upload.middleware';

@Controller()
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // helper simple slug generator from french title
  private slugify(text: string) {
    return (text || '')
      .toString()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private mapPostToFront(p: any) {
    if (!p) return null;
    return {
      id: p._id?.toString(),
      titre: p.title,
      categorie: (p.tags && p.tags[0]) || 'Actualité',
      extrait: p.excerpt || '',
      corps: p.body,
      photo: p.featuredImage ? [p.featuredImage] : undefined,
      idAdmin: p.author || '',
      dateRedaction: p.publishedAt ? new Date(p.publishedAt).toISOString().slice(0,10) : (p.createdAt ? new Date(p.createdAt).toISOString().slice(0,10) : undefined),
      slug: p.slug,
    };
  }

  private mapFrontToDto(front: any, user?: any): CreatePostDto {
    const dto: any = {};
    dto.title = front.titre || front.title;
    dto.slug = front.slug || this.slugify(dto.title || '');
    dto.body = front.corps || front.body;
    dto.excerpt = front.extrait || front.excerpt;
    dto.author = front.idAdmin || front.author || (user ? `${user.prenom} ${user.nom}` : 'admin');
    dto.tags = front.categorie ? [front.categorie] : front.tags || [];
    dto.featuredImage = null; // default to null
    if (front.photo) {
      if (Array.isArray(front.photo) && front.photo.length > 0) dto.featuredImage = front.photo[0];
      else if (typeof front.photo === 'string') dto.featuredImage = front.photo;
    }
    if (front.dateRedaction) dto.publishedAt = front.dateRedaction;
    if (front.status) dto.status = front.status;
    return dto as CreatePostDto;
  }

  @Get('blog')
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('tags') tags?: string,
  ) {
    const pageN = page ? parseInt(page, 10) : 1;
    const limitN = limit ? parseInt(limit, 10) : 10;
    const tagsArr = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined;
    const res = await this.blogService.list({ page: pageN, limit: limitN, q, tags: tagsArr, admin: false });
    const data = res.data.map((p: any) => this.mapPostToFront(p));
    return { ...res, data };
  }

  @Get('blog/:slug')
  async getBySlug(@Param('slug') slug: string) {
    const p = await this.blogService.findBySlug(slug);
    return this.mapPostToFront(p);
  }

  // Admin routes
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/blog')
  async create(@Body() dtoFront: any, @Req() req: any) {
    console.log('Received frontend data:', dtoFront);
    const dto = this.mapFrontToDto(dtoFront, req.user);
    console.log('Mapped DTO:', dto);
    const created = await this.blogService.create(dto as any);
    console.log('Created post in DB:', created);
    return this.mapPostToFront(created);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('admin/blog/:id')
  async update(@Param('id') id: string, @Body() dtoFront: any) {
    const dto: any = {};
    if (dtoFront.titre) dto.title = dtoFront.titre;
    if (dtoFront.corps) dto.body = dtoFront.corps;
    if (dtoFront.extrait) dto.excerpt = dtoFront.extrait;
    if (dtoFront.idAdmin) dto.author = dtoFront.idAdmin;
    if (dtoFront.categorie) dto.tags = [dtoFront.categorie];
    if (dtoFront.photo) dto.featuredImage = Array.isArray(dtoFront.photo) ? dtoFront.photo[0] : dtoFront.photo;
    if (dtoFront.dateRedaction) dto.publishedAt = dtoFront.dateRedaction;
    const updated = await this.blogService.update(id, dto as UpdatePostDto);
    return this.mapPostToFront(updated);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('admin/blog/:id')
  async remove(@Param('id') id: string) {
    return this.blogService.delete(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin/blog/:id/publish')
  async publish(@Param('id') id: string) {
    const post = await this.blogService.publish(id, true);
    return this.mapPostToFront(post);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/blog/upload')
  @UseInterceptors(FileInterceptor('featuredImage', { storage, fileFilter: imageFileFilter }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    console.log('Upload file:', file); // debug log
    if (!file) {
      throw new Error('No file uploaded');
    }
    // Changé le chemin de /uploads/vehicles/ à /uploads/
    return { url: `/uploads/${file.filename}`, filename: file.filename };
  }

  // Dans BlogController, ajoutez après les autres routes admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/blog')
  async listAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('tags') tags?: string,
  ) {
    const pageN = page ? parseInt(page, 10) : 1;
    const limitN = limit ? parseInt(limit, 10) : 10;
    const tagsArr = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined;
    const res = await this.blogService.list({ page: pageN, limit: limitN, q, tags: tagsArr, admin: true });
    const data = res.data.map((p: any) => this.mapPostToFront(p));
    return { ...res, data };
  }
}
