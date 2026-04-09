import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { CloudinaryService } from '../../../shared/cloudinary.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { AdminGuard } from '../../../auth/guards/admin.guard';

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Uploader une image vers Cloudinary' })
  @ApiResponse({ status: 201, description: 'Image uploadée avec succès' })
  @ApiResponse({ status: 400, description: 'Fichier invalide' })
  @ApiConsumes('multipart/form-data')
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Vérifier le type de fichier
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Le fichier doit être une image');
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('La taille du fichier ne doit pas dépasser 5MB');
    }

    try {
      const imageUrl = await this.cloudinaryService.uploadImage(file);
      return {
        success: true,
        url: imageUrl,
        message: 'Image uploadée avec succès',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new BadRequestException(`Erreur lors de l'upload: ${message}`);
    }
  }

  @Post('images')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Uploader plusieurs images vers Cloudinary' })
  @ApiResponse({ status: 201, description: 'Images uploadées avec succès' })
  @ApiResponse({ status: 400, description: 'Fichiers invalides' })
  @ApiConsumes('multipart/form-data')
  async uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Vérifier chaque fichier
    for (const file of files) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('Tous les fichiers doivent être des images');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Chaque fichier ne doit pas dépasser 5MB');
      }
    }

    try {
      const imageUrls = await this.cloudinaryService.uploadMultipleImages(files);
      return {
        success: true,
        urls: imageUrls,
        message: `${files.length} image(s) uploadée(s) avec succès`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new BadRequestException(`Erreur lors de l'upload: ${message}`);
    }
  }
}