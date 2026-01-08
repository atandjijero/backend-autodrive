import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from 'src/auth/schemas/user.schema';
import { Reservation } from 'src/modules/reservations/schema/reservation.schema';
import { Paiement } from 'src/modules/paiements/schemas/paiement.schema';
import { Promotion } from 'src/modules/promotions/schemas/promotion.schema';
import { CreateTemoignageDto } from '../dto/create-temoignage.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Reservation.name) private reservationModel: Model<Reservation>,
    @InjectModel(Paiement.name) private paiementModel: Model<Paiement>,
    @InjectModel(Promotion.name) private promotionModel: Model<Promotion>,
  ) {}

  async getDashboard(userId: string) {
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user || user.deleted) throw new NotFoundException('Utilisateur introuvable');

      const reservations = await this.reservationModel
        .find({ clientId: new Types.ObjectId(userId) })
        .populate('vehicleId')
        .populate('promotionId')
        .exec();

      const reservationIds = reservations.map(r => r._id);

      const paiements = await this.paiementModel
        .find({
          $or: [
            { reservationId: { $in: reservationIds } },
            { reservationId: { $in: reservationIds.map(id => id.toString()) } }
          ]
        })
        .populate('promotionId')
        .exec();

      // Extraction robuste des IDs de promotion (string | ObjectId | document peuplé)
      const promotionCandidates = [
        ...reservations.map(r => r.promotionId).filter(Boolean),
        ...paiements.map(p => p.promotionId).filter(Boolean)
      ];

      const promotionIds = [
        ...new Set(
          promotionCandidates
            .map(id => {
              if (!id) return null;
              if (typeof id === 'string') return id;
              if (Types.ObjectId.isValid(id) && !(id as any)._id) return id.toString();
              if (typeof id === 'object' && (id as any)._id) return (id as any)._id.toString();
              try { return (id as any).toString(); } catch { return null; }
            })
            .filter(Boolean) as string[]
        )
      ];

      const promotions = promotionIds.length > 0
        ? await this.promotionModel.find({ _id: { $in: promotionIds } }).exec()
        : [];

      return {
        profil: {
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role,
        },
        reservations,
        paiements,
        promotions,
        temoignages: user.temoignages ?? [],
      };
    } catch (err) {
      console.error('Erreur getDashboard:', err && err.stack ? err.stack : err);
      throw new InternalServerErrorException('Erreur serveur lors de la récupération du dashboard');
    }
  }

  async addTemoignage(userId: string, dto: CreateTemoignageDto) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $push: { temoignages: dto.message } },
      { new: true },
    );
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user.temoignages;
  }

  async deleteTemoignage(userId: string, message: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user || user.deleted) throw new NotFoundException('Utilisateur introuvable');

    const updatedTemoignages = (user.temoignages ?? []).filter(t => t !== message);
    await this.userModel.findByIdAndUpdate(userId, { temoignages: updatedTemoignages });
    return updatedTemoignages;
  }

  async getTemoignages(userId: string) {
  const user = await this.userModel.findById(userId).exec();
  if (!user || user.deleted) throw new NotFoundException('Utilisateur introuvable');

  // On renvoie les témoignages enrichis avec nom/prénom
  return (user.temoignages ?? []).map(message => ({
    nom: user.nom,
    prenom: user.prenom,
    message,
  }));
}

  async getAllTemoignages() {
    const users = await this.userModel.find({ deleted: false, 'temoignages.0': { $exists: true } }).exec();
    const allTemoignages: { nom: string; prenom: string; message: string }[] = [];
    for (const user of users) {
      for (const message of user.temoignages ?? []) {
        allTemoignages.push({
          nom: user.nom,
          prenom: user.prenom,
          message,
        });
      }
    }
    return allTemoignages;
  }

}