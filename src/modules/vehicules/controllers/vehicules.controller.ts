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
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { VehiclesService } from 'src/modules/vehicules/services/vehicucles.service';
import { CreateVehicleDto } from 'src/modules/vehicules/dto/create-vehicule.dto';
import { UpdateVehicleDto } from 'src/modules/vehicules/dto/update-vehicule.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
@UseGuards(JwtAuthGuard) // tous les endpoints nécessitent un JWT valide
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly configService: ConfigService,
  ) {}

  // Filtre pour n’accepter que les images
  private static imageFileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
      return cb(
        new HttpException('Seules les images JPG/JPEG/PNG sont autorisées', HttpStatus.BAD_REQUEST),
        false,
      );
    }
    cb(null, true);
  }

  // Génération de nom de fichier unique
  private static filename(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExt = extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
  }

  @Post()
  @UseGuards(AdminGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/vehicles',
        filename: VehiclesController.filename,
      }),
      fileFilter: VehiclesController.imageFileFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        carrosserie: { type: 'string' },
        modele: { type: 'string' },
        marque: { type: 'string' },
        transmission: { type: 'string', enum: ['manuelle', 'automatique'] },
        prix: { type: 'number' },
        immatriculation: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async create(@Body() dto: CreateVehicleDto, @UploadedFile() file: Express.Multer.File) {
    let photoUrl: string | undefined;
    if (file) {
      const serverUrl = this.configService.get<string>('SERVER_URL') || 'http://localhost:9000';
      photoUrl = `${serverUrl}/uploads/vehicles/${file.filename}`;
    }
    return this.vehiclesService.create({ ...dto, photos: photoUrl ? [photoUrl] : [] });
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
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Put(':id/unavailable')
  @UseGuards(AdminGuard)
  async markUnavailable(@Param('id') id: string) {
    return this.vehiclesService.markUnavailable(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }

  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/vehicles',
        filename: VehiclesController.filename,
      }),
      fileFilter: VehiclesController.imageFileFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadPhoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('Aucun fichier fourni', HttpStatus.BAD_REQUEST);
    }
    const serverUrl = this.configService.get<string>('SERVER_URL') || 'http://localhost:9000';
    const photoUrl = `${serverUrl}/uploads/vehicles/${file.filename}`;
    return this.vehiclesService.addPhoto(id, photoUrl);
  }
}