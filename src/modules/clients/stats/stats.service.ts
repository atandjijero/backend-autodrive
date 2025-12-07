import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, Role } from 'src/auth/schemas/user.schema';
import { Reservation, ReservationDocument } from 'src/modules/reservations/schema/reservation.schema';
import { Paiement, PaiementDocument } from 'src/modules/paiements/schemas/paiement.schema';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    @InjectModel(Paiement.name) private paiementModel: Model<PaiementDocument>,
  ) {}

  async getClientStats() {
    // Total clients (tous sauf admin)
    const totalClients = await this.userModel.countDocuments({
      role: { $ne: Role.Admin },
      deleted: false,
    });

    //  Total par rôle
    const totalClientsByRole = {
      client: await this.userModel.countDocuments({ role: Role.Client, deleted: false }),
      entreprise: await this.userModel.countDocuments({ role: Role.Entreprise, deleted: false }),
      tourist: await this.userModel.countDocuments({ role: Role.Tourist, deleted: false }),
    };

    //  Clients ayant fait au moins une réservation
    const clientsWithReservations = await this.reservationModel
      .distinct('clientId')
      .then(ids => ids.length);

    //  Clients ayant effectué un paiement
    const clientsWithPayments = await this.paiementModel
      .distinct('email')
      .then(emails => emails.length);

    return {
      totalClients,
      totalClientsByRole,
      clientsWithReservations,
      clientsWithPayments,
    };
  }
}
