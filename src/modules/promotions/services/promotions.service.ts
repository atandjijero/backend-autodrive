import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Promotion, PromotionDocument, StatutPromotion } from 'src/modules/promotions/schemas/promotion.schema';
import { CreatePromotionDto } from 'src/modules/promotions/dto/create-promotion.dto';
import { UpdatePromotionDto } from 'src/modules/promotions/dto/update-promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectModel(Promotion.name)
    private promotionModel: Model<PromotionDocument>,
  ) {}

  async create(createPromotionDto: CreatePromotionDto): Promise<PromotionDocument> {
  try {
    // Validation des dates
    const dateDebut = new Date(createPromotionDto.dateDebut);
    const dateFin = new Date(createPromotionDto.dateFin);

    // Vérifier que la date de fin est après la date de début
    if (dateFin <= dateDebut) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début');
    }

    // Normaliser les dates à minuit pour comparer uniquement jour/mois/année
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateDebutNormalized = new Date(dateDebut);
    dateDebutNormalized.setHours(0, 0, 0, 0);

    if (dateDebutNormalized < today) {
      throw new BadRequestException('La date de début ne peut pas être dans le passé');
    }

    // Validation de la valeur selon le type
    if (createPromotionDto.type === 'pourcentage' && createPromotionDto.valeur > 100) {
      throw new BadRequestException('Le pourcentage ne peut pas dépasser 100%');
    }

    const promotion = new this.promotionModel({
      titre: createPromotionDto.titre,
      description: createPromotionDto.description,
      type: createPromotionDto.type,
      valeur: createPromotionDto.valeur,
      dateDebut,
      dateFin,
      vehiculeId: createPromotionDto.vehiculeId,
      utilisationMax: createPromotionDto.utilisationMax ?? 0,
      codesPromo: createPromotionDto.codesPromo ?? [],
      dureeMinLocation: createPromotionDto.dureeMinLocation ?? 1,
      montantMinCommande: createPromotionDto.montantMinCommande ?? 0,
      utilisations: 0,
      statut: 'active',
      deleted: false,
    });

    return await promotion.save();
  } catch (error) {
    throw new BadRequestException(`Erreur lors de la création de la promotion: ${error.message}`);
  }
}


  async findAll(): Promise<PromotionDocument[]> {
    return this.promotionModel
      .find({ deleted: false })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findActive(): Promise<PromotionDocument[]> {
    const now = new Date();
    return this.promotionModel.aggregate([
      {
        $match: {
          deleted: false,
          statut: 'active',
          dateDebut: { $lte: now },
          dateFin: { $gte: now },
        },
      },
      {
        $addFields: {
          vehiculeIdObj: { $toObjectId: '$vehiculeId' },
        },
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehiculeIdObj',
          foreignField: '_id',
          as: 'vehicule',
        },
      },
      {
        $unwind: '$vehicule',
      },
      {
        $match: {
          'vehicule.deleted': false,
        },
      },
      {
        $project: {
          vehicule: 0,
          vehiculeIdObj: 0,
        },
      },
    ]);
  }

  async findById(id: string): Promise<PromotionDocument> {
    const promotion = await this.promotionModel
      .findById(id)
      .exec();

    if (!promotion || promotion.deleted) {
      throw new NotFoundException('Promotion introuvable');
    }

    return promotion;
  }

  async findByCode(code: string): Promise<PromotionDocument | null> {
    return this.promotionModel
      .findOne({
        deleted: false,
        statut: 'active',
        codesPromo: code,
        dateDebut: { $lte: new Date() },
        dateFin: { $gte: new Date() },
      })
      .exec();
  }

  async update(id: string, updatePromotionDto: UpdatePromotionDto): Promise<PromotionDocument> {
    const promotion = await this.findById(id);

    // Validation des dates si elles sont modifiées
    if (updatePromotionDto.dateDebut || updatePromotionDto.dateFin) {
      const dateDebut = updatePromotionDto.dateDebut
        ? new Date(updatePromotionDto.dateDebut)
        : promotion.dateDebut;
      const dateFin = updatePromotionDto.dateFin
        ? new Date(updatePromotionDto.dateFin)
        : promotion.dateFin;

      if (dateFin <= dateDebut) {
        throw new BadRequestException('La date de fin doit être postérieure à la date de début');
      }
    }

    Object.assign(promotion, updatePromotionDto);
    return await promotion.save();
  }

  async delete(id: string): Promise<void> {
    const promotion = await this.findById(id);
    promotion.deleted = true;
    promotion.deletedAt = new Date();
    await promotion.save();
  }

  async incrementUtilisation(id: string): Promise<void> {
    await this.promotionModel.findByIdAndUpdate(id, { $inc: { utilisations: 1 } });
  }

  async appliquerPromotion(promotionId: string, montantBase: number, vehiculeId?: string): Promise<{
    montantRemise: number;
    montantFinal: number;
    promotion: PromotionDocument;
  }> {
    const promotion = await this.findById(promotionId);

    // Vérifier si la promotion est applicable
    const now = new Date();
    if (promotion.statut !== 'active' ||
        promotion.dateDebut > now ||
        promotion.dateFin < now) {
      throw new BadRequestException('Cette promotion n\'est pas active');
    }

    // Vérifier les limites d'utilisation
    if (promotion.utilisationMax && promotion.utilisationMax > 0 && promotion.utilisations >= promotion.utilisationMax) {
      throw new BadRequestException('Cette promotion a atteint sa limite d\'utilisation');
    }

    // Vérifier si la promotion s'applique au véhicule
    if (promotion.vehiculeId && vehiculeId && promotion.vehiculeId.toString() !== vehiculeId) {
      throw new BadRequestException('Cette promotion ne s\'applique pas à ce véhicule');
    }

    // Calculer la remise
    let montantRemise = 0;
    if (promotion.type === 'pourcentage') {
      montantRemise = (montantBase * promotion.valeur) / 100;
    } else {
      montantRemise = Math.min(promotion.valeur, montantBase);
    }

    const montantFinal = Math.max(0, montantBase - montantRemise);

    // Incrémenter le compteur d'utilisation
    await this.incrementUtilisation(promotionId);

    return {
      montantRemise,
      montantFinal,
      promotion,
    };
  }
}