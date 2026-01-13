import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards, UseInterceptors, UploadedFile, Req, Res, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags,ApiBearerAuth,ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import PDFKit from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { AgencyDocument, Agency } from '../schemas/agency.schema';
import { AgenciesService } from '../services/agencies.service';
import { CreateAgencyDto } from '../dto/create-agency.dto';
import { UpdateAgencyDto } from '../dto/update-agency.dto';
import { AgencyResponseDto } from '../dto/agency-response.dto';
import { AgenciesListResponseDto } from '../dto/agencies-list-response.dto';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { AdminGuard } from '../../../auth/guards/admin.guard';
import { storage, imageFileFilter } from '../../blog/upload.middleware';
import { agencyStorage, agencyImageFileFilter } from '../upload.middleware';

@ApiTags('Agencies')
@ApiBearerAuth()
@Controller('admin/agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les agences avec pagination et recherche' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page (défaut: 10)' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Recherche textuelle' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrer par statut actif' })
  @ApiResponse({ status: 200, description: 'Liste des agences', type: AgenciesListResponseDto })
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('isActive') isActive?: string,
  ) {
    const pageN = page ? parseInt(page, 10) : 1;
    const limitN = limit ? parseInt(limit, 10) : 10;
    const isActiveBool = isActive ? isActive === 'true' : undefined;
    return this.agenciesService.findAll({ page: pageN, limit: limitN, q, isActive: isActiveBool });
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Rechercher les agences proches d\'une position GPS' })
  @ApiQuery({ name: 'longitude', required: true, type: Number, description: 'Longitude du point de recherche' })
  @ApiQuery({ name: 'latitude', required: true, type: Number, description: 'Latitude du point de recherche' })
  @ApiQuery({ name: 'maxDistance', required: false, type: Number, description: 'Distance maximale en mètres (défaut: 10000)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre maximum d\'agences à retourner (défaut: 10)' })
  @ApiResponse({ status: 200, description: 'Liste des agences proches', type: [AgencyResponseDto] })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  async getNearbyAgencies(
    @Query('longitude') longitude: string,
    @Query('latitude') latitude: string,
    @Query('maxDistance') maxDistance?: string,
    @Query('limit') limit?: string,
  ) {
    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const maxDist = maxDistance ? parseInt(maxDistance, 10) : 10000;
    const lim = limit ? parseInt(limit, 10) : 10;

    if (isNaN(lng) || isNaN(lat)) {
      throw new BadRequestException('Coordonnées GPS invalides');
    }

    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      throw new BadRequestException('Coordonnées GPS hors limites');
    }

    if (maxDist < 0 || maxDist > 100000) {
      throw new BadRequestException('Distance maximale invalide (0-100000 mètres)');
    }

    if (lim < 1 || lim > 50) {
      throw new BadRequestException('Limite invalide (1-50 agences)');
    }

    return this.agenciesService.findNearbyAgencies(lng, lat, maxDist, lim);
  }

  @Get('active/all')
  @ApiOperation({ summary: 'Lister toutes les agences actives' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page (défaut: 10)' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Recherche textuelle' })
  @ApiResponse({ status: 200, description: 'Liste des agences actives', type: AgenciesListResponseDto })
  async getActiveAgencies(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    const pageN = page ? parseInt(page, 10) : 1;
    const limitN = limit ? parseInt(limit, 10) : 10;
    return this.agenciesService.findAll({ page: pageN, limit: limitN, q, isActive: true });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une agence par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'agence' })
  @ApiResponse({ status: 200, description: 'Agence trouvée', type: AgencyResponseDto })
  @ApiResponse({ status: 404, description: 'Agence non trouvée' })
  async getById(@Param('id') id: string) {
    return this.agenciesService.findById(id);
  }

  // Admin routes
  @UseInterceptors(FileInterceptor('logo', { storage: agencyStorage, fileFilter: agencyImageFileFilter }))
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle agence (Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Données de l\'agence',
    schema: {
      type: 'object',
      required: ['name', 'address', 'city', 'postalCode', 'country', 'phone', 'email'],
      properties: {
        name: { type: 'string', example: 'Agence Paris Centre' },
        address: { type: 'string', example: '123 Rue de la Paix' },
        city: { type: 'string', example: 'Paris' },
        postalCode: { type: 'string', example: '75001' },
        country: { type: 'string', example: 'France' },
        phone: { type: 'string', example: '+33123456789' },
        email: { type: 'string', example: 'contact@agence-paris.fr' },
        manager: { type: 'string', example: 'Jean Dupont' },
        description: { type: 'string', example: 'Agence principale de Paris' },
        isActive: { type: 'boolean', example: true },
        logo: { type: 'string', format: 'binary', description: 'Fichier image du logo' },
        location: {
          type: 'object',
          description: 'Coordonnées GPS de l\'agence',
          properties: {
            latitude: { type: 'number', description: 'Latitude', example: 48.8566 },
            longitude: { type: 'number', description: 'Longitude', example: 2.3522 }
          }
        }
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Agence créée', type: AgencyResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé - Token JWT manquant ou invalide' })
  async create(@Body() dto: CreateAgencyDto, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      dto.logo = file.filename;
    }
    return this.agenciesService.create(dto);
  }

  @UseInterceptors(FileInterceptor('logo', { storage: agencyStorage, fileFilter: agencyImageFileFilter }))
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une agence (Admin)' })
  @ApiParam({ name: 'id', description: 'ID de l\'agence' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Données à mettre à jour',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Agence Paris Centre' },
        address: { type: 'string', example: '123 Rue de la Paix' },
        city: { type: 'string', example: 'Paris' },
        postalCode: { type: 'string', example: '75001' },
        country: { type: 'string', example: 'France' },
        phone: { type: 'string', example: '+33123456789' },
        email: { type: 'string', example: 'contact@agence-paris.fr' },
        manager: { type: 'string', example: 'Jean Dupont' },
        description: { type: 'string', example: 'Agence principale de Paris' },
        isActive: { type: 'boolean', example: true },
        logo: { type: 'string', format: 'binary', description: 'Fichier image du logo' },
        location: {
          type: 'object',
          description: 'Coordonnées GPS de l\'agence',
          properties: {
            latitude: { type: 'number', description: 'Latitude', example: 48.8566 },
            longitude: { type: 'number', description: 'Longitude', example: 2.3522 }
          }
        }
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Agence mise à jour', type: AgencyResponseDto })
  @ApiResponse({ status: 404, description: 'Agence non trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async update(@Param('id') id: string, @Body() dto: UpdateAgencyDto, @UploadedFile() file?: Express.Multer.File) {
    if (file) {
      dto.logo = file.filename;
    }
    return this.agenciesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une agence (Admin)' })
  @ApiParam({ name: 'id', description: 'ID de l\'agence' })
  @ApiResponse({ status: 200, description: 'Agence supprimée' })
  @ApiResponse({ status: 404, description: 'Agence non trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async delete(@Param('id') id: string) {
    return this.agenciesService.delete(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Activer/Désactiver une agence (Admin)' })
  @ApiParam({ name: 'id', description: 'ID de l\'agence' })
  @ApiResponse({ status: 200, description: 'Statut de l\'agence modifié', type: AgencyResponseDto })
  @ApiResponse({ status: 404, description: 'Agence non trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async toggleActive(@Param('id') id: string) {
    if (!id || id === 'undefined') {
      throw new BadRequestException('ID d\'agence invalide');
    }
    return this.agenciesService.toggleActive(id);
  }

  @Get(':id/export-pdf')
  @ApiOperation({ summary: 'Exporter les informations de l\'agence en PDF' })
  @ApiParam({ name: 'id', description: 'ID de l\'agence' })
  @ApiResponse({ status: 200, description: 'PDF généré avec succès' })
  @ApiResponse({ status: 404, description: 'Agence non trouvée' })
  async exportAgencyToPdf(@Param('id') id: string, @Res() res: Response) {
    const agency = await this.agenciesService.findById(id) as AgencyDocument;

    // Créer un nouveau document PDF
    const doc = new PDFKit({
      size: 'A4',
      margin: 50
    });

    // Définir les headers de réponse
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=agency-${agency.name.replace(/\s+/g, '-')}.pdf`);

    // Pipe le PDF vers la réponse
    doc.pipe(res);

    // Ajouter le logo si disponible
    if (agency.logo) {
      const logoPath = path.join(process.cwd(), 'uploads', 'agencies', agency.logo);
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 50, 50, { width: 100 });
        } catch (error) {
          console.log('Erreur lors du chargement du logo:', error);
        }
      }
    }

    // Titre
    doc.fontSize(24).font('Helvetica-Bold').text('Fiche Agence', 200, 50);
    doc.moveDown(2);

    // Informations de l'agence
    doc.fontSize(16).font('Helvetica-Bold').text('Informations Générales');
    doc.moveDown(0.5);

    doc.fontSize(12).font('Helvetica');
    doc.text(`Nom: ${agency.name}`);
    doc.text(`Adresse: ${agency.address}`);
    doc.text(`Ville: ${agency.city}, ${agency.postalCode}`);
    doc.text(`Pays: ${agency.country}`);
    doc.text(`Téléphone: ${agency.phone}`);
    doc.text(`Email: ${agency.email}`);
    doc.text(`Statut: ${agency.isActive ? 'Actif' : 'Inactif'}`);

    if (agency.manager) {
      doc.text(`Responsable: ${agency.manager}`);
    }

    if (agency.description) {
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Description:');
      doc.font('Helvetica').text(agency.description);
    }

    // Informations de date
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica');
    const agencyDoc = agency as any;
    doc.text(`Créée le: ${new Date(agencyDoc.createdAt).toLocaleDateString('fr-FR')}`);
    doc.text(`Dernière modification: ${new Date(agencyDoc.updatedAt).toLocaleDateString('fr-FR')}`);

    // Finaliser le PDF
    doc.end();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Importer des agences depuis un fichier JSON (Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Fichier JSON contenant les données des agences',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Fichier JSON à importer' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Agences importées avec succès' })
  @ApiResponse({ status: 400, description: 'Format de fichier invalide' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async importAgencies(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('Aucun fichier fourni');
    }

    if (file.mimetype !== 'application/json') {
      throw new Error('Le fichier doit être au format JSON');
    }

    try {
      const fileContent = file.buffer.toString('utf-8');
      const agenciesData = JSON.parse(fileContent);

      if (!Array.isArray(agenciesData)) {
        throw new Error('Le fichier JSON doit contenir un tableau d\'agences');
      }

      const importedAgencies: Agency[] = [];
      for (const agencyData of agenciesData) {
        try {
          const agency = await this.agenciesService.create(agencyData);
          importedAgencies.push(agency);
        } catch (error) {
          console.error(`Erreur lors de l'import de l'agence ${agencyData.name}:`, error);
          // Continue avec les autres agences
        }
      }

      return {
        message: `${importedAgencies.length} agences importées avec succès`,
        imported: importedAgencies.length,
        total: agenciesData.length,
        agencies: importedAgencies
      };
    } catch (error) {
      throw new Error(`Erreur lors de l'import: ${error.message}`);
    }
  }
}