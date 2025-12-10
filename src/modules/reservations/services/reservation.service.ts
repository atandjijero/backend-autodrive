import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Reservation,
  ReservationDocument,
  StatutReservation,
} from 'src/modules/reservations/schema/reservation.schema';
import { Vehicle, VehicleDocument } from 'src/modules/vehicules/schemas/vehicule.schema';
import { CreateReservationDto } from 'src/modules/reservations/dto/create-reservation.dto';

@Injectable()
export class ReservationService {
  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
    @InjectModel(Vehicle.name)
    private vehicleModel: Model<VehicleDocument>,
  ) {}

  //  Génère un numéro unique de réservation
  private generateReservationNumber(): string {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `RES-${date}-${random}`;
  }

  // Vérifie si la réservation est expirée et met à jour automatiquement
  private async checkAndUpdateStatus(reservation: ReservationDocument) {
    const now = new Date();

    if (
      reservation.statut === StatutReservation.EnCours &&
      reservation.dateFin < now
    ) {
      reservation.statut = StatutReservation.Terminee;
      await reservation.save();

      // Libérer le véhicule
      const vehicle = await this.vehicleModel.findById(reservation.vehicleId);
      if (vehicle) {
        vehicle.disponible = true;
        await vehicle.save();
      }
    }

    return reservation;
  }

  async create(data: CreateReservationDto): Promise<Reservation> {
    try {
      const vehicle = await this.vehicleModel.findById(data.vehicleId).exec();
      if (!vehicle || vehicle.deleted || !vehicle.disponible) {
        throw new BadRequestException('Véhicule non disponible');
      }

      const overlap = await this.reservationModel.findOne({
        vehicleId: new Types.ObjectId(data.vehicleId),
        statut: StatutReservation.EnCours,
        $or: [
          { dateDebut: { $lte: data.dateFin }, dateFin: { $gte: data.dateDebut } },
        ],
      });

      if (overlap) {
        throw new BadRequestException(
          'Le véhicule est déjà réservé sur cette période',
        );
      }

      // Génération du numéro de réservation
      const numeroReservation = this.generateReservationNumber();

      const reservation = new this.reservationModel({
        vehicleId: new Types.ObjectId(data.vehicleId),
        clientId: new Types.ObjectId(data.clientId),
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        statut: StatutReservation.EnCours,
        numeroReservation, 
      });

      const savedReservation = await reservation.save();

      vehicle.disponible = false;
      await vehicle.save();

      return savedReservation;
    } catch (error) {
      throw new InternalServerErrorException(
        `Erreur lors de la création de la réservation: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<Reservation[]> {
  try {
    const reservations = await this.reservationModel
      .find()
      .populate('vehicleId')
      .populate('clientId')
      .exec();

    return Promise.all(reservations.map(r => this.checkAndUpdateStatus(r)));
  } catch (error) {
    console.error(" ERREUR FINDALL :", error); 
    throw new InternalServerErrorException(
      `Erreur lors de la récupération des réservations: ${error.message}`,
    );
  }
}


  async findById(id: string): Promise<Reservation> {
    const reservation = await this.reservationModel
      .findById(id)
      .populate('vehicleId')
      .populate('clientId')
      .exec();

    if (!reservation) {
      throw new NotFoundException('Réservation non trouvée');
    }

    return this.checkAndUpdateStatus(reservation);
  }

  async updateStatut(id: string, statut: StatutReservation): Promise<Reservation> {
    const reservation = await this.reservationModel
      .findByIdAndUpdate(id, { statut }, { new: true })
      .exec();

    if (!reservation) throw new NotFoundException('Réservation non trouvée');

    if (
      statut === StatutReservation.Terminee ||
      statut === StatutReservation.Annulee
    ) {
      const vehicle = await this.vehicleModel.findById(reservation.vehicleId).exec();
      if (vehicle) {
        vehicle.disponible = true;
        await vehicle.save();
      }
    }

    return reservation;
  }

  async delete(id: string): Promise<Reservation> {
    const reservation = await this.reservationModel.findByIdAndDelete(id).exec();
    if (!reservation) throw new NotFoundException('Réservation non trouvée');

    const vehicle = await this.vehicleModel.findById(reservation.vehicleId).exec();
    if (vehicle) {
      vehicle.disponible = true;
      await vehicle.save();
    }

    return reservation;
  }
}
