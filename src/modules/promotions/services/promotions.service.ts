import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import {
  Promotion,
  StatutPromotion,
  TypePromotion,
} from '@prisma/client';
import { CreatePromotionDto } from 'src/modules/promotions/dto/create-promotion.dto';
import { UpdatePromotionDto } from 'src/modules/promotions/dto/update-promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(dto: CreatePromotionDto): Promise<Promotion> {
    try {
      const dateDebut = new Date(dto.dateDebut);
      const dateFin = new Date(dto.dateFin);

      if (dateFin <= dateDebut) {
        throw new BadRequestException('La date de fin doit être postérieure à la date de début');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dateDebutNormalized = new Date(dateDebut);
      dateDebutNormalized.setHours(0, 0, 0, 0);

      if (dateDebutNormalized < today) {
        throw new BadRequestException('La date de début ne peut pas être dans le passé');
      }

      if (dto.type === 'pourcentage' && dto.valeur > 100) {
        throw new BadRequestException('Le pourcentage ne peut pas dépasser 100%');
      }

      const codesPromo = (dto.codesPromo ?? [])
        .map(code => code.trim())
        .filter(code => code.length > 0);

      const vehiculesIds = (dto.vehiculesIds as any as string[] ?? []).map(id => parseInt(id));

      return await this.prisma.promotion.create({
        data: {
          titre: dto.titre,
          description: dto.description,
          type: dto.type as TypePromotion,
          valeur: dto.valeur,
          dateDebut,
          dateFin,
          vehiculesIds,
          utilisationMax: dto.utilisationMax ?? 0,
          codesPromo,
          dureeMinLocation: dto.dureeMinLocation ?? 1,
          montantMinCommande: dto.montantMinCommande ?? 0,
          utilisations: 0,
          statut: StatutPromotion.active,
          deleted: false,
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Erreur lors de la création de la promotion: ${error.message}`);
    }
  }

  async findAll(): Promise<Promotion[]> {
    return this.prisma.promotion.findMany({
      where: { deleted: false, statut: StatutPromotion.active },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllAdmin(): Promise<Promotion[]> {
    return this.prisma.promotion.findMany({
      where: { deleted: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive(): Promise<Promotion[]> {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        deleted: false,
        statut: StatutPromotion.active,
        dateDebut: { lte: now },
        dateFin: { gte: now },
      },
    });
  }

  async findById(id: number): Promise<Promotion> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion || promotion.deleted) {
      throw new NotFoundException('Promotion introuvable');
    }

    return promotion;
  }

  async findByCode(code: string): Promise<Promotion | null> {
    return this.prisma.promotion.findFirst({
      where: {
        deleted: false,
        statut: StatutPromotion.active,
        codesPromo: { has: code },
        dateDebut: { lte: new Date() },
        dateFin: { gte: new Date() },
      },
    });
  }

  async update(id: number, dto: UpdatePromotionDto): Promise<Promotion> {
    const promotion = await this.findById(id);

    if (dto.dateDebut || dto.dateFin) {
      const dateDebut = dto.dateDebut ? new Date(dto.dateDebut) : promotion.dateDebut;
      const dateFin = dto.dateFin ? new Date(dto.dateFin) : promotion.dateFin;

      if (dateFin <= dateDebut) {
        throw new BadRequestException('La date de fin doit être postérieure à la date de début');
      }
    }

    const updateData: any = { ...dto };
    if (dto.vehiculesIds) {
      updateData.vehiculesIds = (dto.vehiculesIds as any as string[]).map(vid => parseInt(vid));
    }

    return await this.prisma.promotion.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.promotion.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
  }

  async incrementUtilisation(id: number): Promise<void> {
    await this.prisma.promotion.update({
      where: { id },
      data: { utilisations: { increment: 1 } },
    });
  }

  async appliquerPromotion(promotionId: number, montantBase: number, vehiculeId?: number): Promise<{
    montantRemise: number;
    montantFinal: number;
    promotion: Promotion;
  }> {
    const promotion = await this.findById(promotionId);

    const now = new Date();
    if (promotion.statut !== StatutPromotion.active ||
        promotion.dateDebut > now ||
        promotion.dateFin < now) {
      throw new BadRequestException('Cette promotion n\'est pas active');
    }

    if (promotion.utilisationMax && promotion.utilisationMax > 0 && promotion.utilisations >= promotion.utilisationMax) {
      throw new BadRequestException('Cette promotion a atteint sa limite d\'utilisation');
    }

    if (promotion.vehiculesIds && promotion.vehiculesIds.length > 0 && vehiculeId) {
      const isApplicable = promotion.vehiculesIds.includes(vehiculeId);
      if (!isApplicable) {
        throw new BadRequestException('Cette promotion ne s\'applique pas à ce véhicule');
      }
    }

    let montantRemise = 0;
    if (promotion.type === TypePromotion.pourcentage) {
      montantRemise = (montantBase * promotion.valeur) / 100;
    } else {
      montantRemise = Math.min(promotion.valeur, montantBase);
    }

    const montantFinal = Math.max(0, montantBase - montantRemise);

    await this.incrementUtilisation(promotionId);

    return {
      montantRemise,
      montantFinal,
      promotion,
    };
  }
}