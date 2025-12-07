import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreatePaiementDto } from '../dto/create-paiement.dto';
import {
  Paiement,
  PaiementDocument,
  StatutPaiement,
} from '../schemas/paiement.schema';
import { Reservation, ReservationDocument } from 'src/modules/reservations/schema/reservation.schema';
import { MailService } from 'src/shared/mail.service';

@Injectable()
export class PaiementsService {
  constructor(
    @InjectModel(Paiement.name)
    private paiementModel: Model<PaiementDocument>,

    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,

    private mailService: MailService,
  ) {}

  async creerPaiement(data: CreatePaiementDto) {
    try {
      //  Vérifier que la réservation existe
      const reservation = await this.reservationModel.findById(data.reservationId);

      if (!reservation) {
        throw new NotFoundException("La réservation associée est introuvable");
      }

      //  Vérification expiration carte
      const [month, year] = data.expiration.split('/').map(Number);
      const now = new Date();
      const expiryDate = new Date(2000 + year, month);

      if (expiryDate < now) {
        throw new BadRequestException("La carte est expirée");
      }

      // Paiement simulé
      const paiement = new this.paiementModel({
        ...data,
        statut: StatutPaiement.Reussi,
      });

      const saved = await paiement.save();

      //  Envoi email confirmation
      await this.mailService.sendPaymentConfirmation(
        data.email,
        data.nom,
        data.montant,
      );

      return saved;
    } catch (error) {
      throw new InternalServerErrorException(
        "Erreur lors du traitement du paiement : " + error.message,
      );
    }
  }

  async findAll() {
  return this.paiementModel
    .find()
    .populate({
      path: 'reservationId',
      populate: [
        { path: 'vehicleId' },
        { path: 'clientId' }
      ]
    })
    .sort({ createdAt: -1 });
}

async findById(id: string) {
  const paiement = await this.paiementModel
    .findById(id)
    .populate({
      path: 'reservationId',
      populate: [
        { path: 'vehicleId' },
        { path: 'clientId' }
      ]
    });

  if (!paiement) {
    throw new BadRequestException("Paiement introuvable");
  }

  return paiement;
}

}
