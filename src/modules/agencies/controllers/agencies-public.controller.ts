import { Controller, Get, Param, Query, Res, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import PDFKit from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { AgencyDocument } from '../schemas/agency.schema';
import { AgenciesService } from '../services/agencies.service';
import { AgencyResponseDto } from '../dto/agency-response.dto';
import { AgenciesListResponseDto } from '../dto/agencies-list-response.dto';

@ApiTags('Agencies Public')
@Controller('agencies')
export class AgenciesPublicController {
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
    doc.fontSize(24).text(agency.name, 50, 120);

    // Informations de base
    doc.fontSize(12).text(`Adresse: ${agency.address}`, 50, 160);
    doc.text(`Ville: ${agency.city}`, 50, 180);
    doc.text(`Code postal: ${agency.postalCode}`, 50, 200);
    doc.text(`Pays: ${agency.country}`, 50, 220);
    doc.text(`Téléphone: ${agency.phone}`, 50, 240);
    doc.text(`Email: ${agency.email}`, 50, 260);

    if (agency.manager) {
      doc.text(`Manager: ${agency.manager}`, 50, 280);
    }

    if (agency.description) {
      doc.text(`Description: ${agency.description}`, 50, 300);
    }

    doc.text(`Statut: ${agency.isActive ? 'Actif' : 'Inactif'}`, 50, 320);

    // Finaliser le PDF
    doc.end();
  }
}