import {
  Body,
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpException,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { VehiclesService } from 'src/modules/vehicules/services/vehicucles.service';
import { CreateVehicleDto } from 'src/modules/vehicules/dto/create-vehicule.dto';
import { UpdateVehicleDto } from 'src/modules/vehicules/dto/update-vehicule.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'src/shared/cloudinary.service';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly configService: ConfigService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private static imageFileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
      return cb(
        new HttpException('Seules les images JPG/JPEG/PNG sont autorisées', HttpStatus.BAD_REQUEST),
        false,
      );
    }
    cb(null, true);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      fileFilter: VehiclesController.imageFileFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  async create(@Body() dto: CreateVehicleDto, @UploadedFiles() files: Express.Multer.File[]) {
    let photoUrls: string[] = [];
    if (files && files.length > 0) {
      photoUrls = await this.cloudinaryService.uploadMultipleImages(files, 'vehicles');
    }
    return this.vehiclesService.create({ ...dto, photos: photoUrls });
  }

  @Get()
  findAll() {
    return this.vehiclesService.findAll();
  }

  @Get('promotions')
  findPromotions() {
    return this.vehiclesService.findPromotions();
  }

  @Get('available')
  findAvailable() {
    return this.vehiclesService.findAvailable();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      fileFilter: VehiclesController.imageFileFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UpdateVehicleDto,
  ) {
    let newPhotoUrls: string[] = [];
    if (files && files.length > 0) {
      newPhotoUrls = await this.cloudinaryService.uploadMultipleImages(files, 'vehicles');
    }

    const updatedPhotos = [
      ...(dto.photos ?? []),
      ...newPhotoUrls,
    ];

    return this.vehiclesService.update(id, {
      ...dto,
      photos: updatedPhotos,
    });
  }

  @Put(':id/unavailable')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async markUnavailable(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.markUnavailable(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() currentUser: any) {
    return this.vehiclesService.remove(id, currentUser.role);
  }

  @Post(':id/photo')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: VehiclesController.imageFileFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  async uploadPhoto(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('Aucun fichier fourni', HttpStatus.BAD_REQUEST);
    }
    const photoUrl = await this.cloudinaryService.uploadImage(file, 'vehicles');
    return this.vehiclesService.addPhoto(id, photoUrl);
  }
}
