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

  async create(data: CreateReservationDto): Promise<Reservation> {
    try {
      // Vérifier que le véhicule existe et est disponible
      const vehicle = await this.vehicleModel.findById(data.vehicleId).exec();
      if (!vehicle || vehicle.deleted || !vehicle.disponible) {
        throw new BadRequestException('Véhicule non disponible');
      }

      // Vérifier chevauchement de dates
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

      // Validation automatique
      const reservation = new this.reservationModel({
        vehicleId: new Types.ObjectId(data.vehicleId),
        clientId: new Types.ObjectId(data.clientId),
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        statut: StatutReservation.EnCours,
      });

      const savedReservation = await reservation.save();

      // Mettre le véhicule en indisponible automatiquement
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
      return this.reservationModel
        .find()
        .populate('vehicleId')
        .populate('clientId')
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(
        `Erreur lors de la récupération des réservations: ${error.message}`,
      );
    }
  }

  async findById(id: string): Promise<Reservation> {
    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) throw new NotFoundException('Réservation non trouvée');
    return reservation;
  }

  async updateStatut(id: string, statut: StatutReservation): Promise<Reservation> {
    const reservation = await this.reservationModel
      .findByIdAndUpdate(id, { statut }, { new: true })
      .exec();

    if (!reservation) throw new NotFoundException('Réservation non trouvée');

    // Si la réservation est terminée ou annulée → rendre le véhicule disponible
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

    // Libérer le véhicule si la réservation est supprimée
    const vehicle = await this.vehicleModel.findById(reservation.vehicleId).exec();
    if (vehicle) {
      vehicle.disponible = true;
      await vehicle.save();
    }

    return reservation;
  }
}
