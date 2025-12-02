import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Vehicle,
  VehicleDocument,
} from 'src/modules/vehicules/schemas/vehicule.schema';
import { CreateVehicleDto } from 'src/modules/vehicules/dto/create-vehicule.dto';
import { UpdateVehicleDto } from 'src/modules/vehicules/dto/update-vehicule.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<VehicleDocument>,
  ) {}

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    try {
      const vehicle = new this.vehicleModel({
        ...dto,
        deleted: false,
        disponible: true,
        photos: dto.photos ?? [],
      });
      return await vehicle.save();
    } catch (error) {
      throw new InternalServerErrorException(
        `Erreur lors de la création du véhicule: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<Vehicle[]> {
    try {
      return await this.vehicleModel.find({ deleted: false }).exec();
    } catch (error) {
      throw new InternalServerErrorException(
        `Erreur lors de la récupération des véhicules: ${error.message}`,
      );
    }
  }

  async findPromotions(): Promise<Vehicle[]> {
    try {
      return await this.vehicleModel
        .find({ deleted: false, prix: { $lt: 20000 } })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(
        `Erreur lors de la récupération des promotions: ${error.message}`,
      );
    }
  }

  async findOne(id: string): Promise<Vehicle> {
    try {
      const vehicle = await this.vehicleModel.findById(id).exec();
      if (!vehicle || vehicle.deleted) {
        throw new NotFoundException('Véhicule introuvable');
      }
      return vehicle;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Erreur lors de la récupération du véhicule: ${error.message}`,
      );
    }
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    try {
      const vehicle = await this.vehicleModel
        .findByIdAndUpdate(id, dto, { new: true })
        .exec();
      if (!vehicle || vehicle.deleted) {
        throw new NotFoundException('Véhicule introuvable');
      }
      return vehicle;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Erreur lors de la mise à jour du véhicule: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<Vehicle> {
    try {
      const vehicle = await this.vehicleModel
        .findByIdAndUpdate(
          id,
          { deleted: true, deletedAt: new Date() },
          { new: true },
        )
        .exec();
      if (!vehicle) {
        throw new NotFoundException('Véhicule introuvable');
      }
      return vehicle;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Erreur lors de la suppression du véhicule: ${error.message}`,
      );
    }
  }

  async addPhoto(id: string, photoUrl: string): Promise<Vehicle> {
    try {
      const vehicle = await this.vehicleModel
        .findByIdAndUpdate(
          id,
          { $push: { photos: photoUrl } },
          { new: true },
        )
        .exec();
      if (!vehicle || vehicle.deleted) {
        throw new NotFoundException('Véhicule introuvable');
      }
      return vehicle;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Erreur lors de l’ajout de la photo: ${error.message}`,
      );
    }
  }

  async findAvailable(): Promise<Vehicle[]> {
    try {
      return await this.vehicleModel
        .find({ deleted: false, disponible: true })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(
        `Erreur lors de la récupération des véhicules disponibles: ${error.message}`,
      );
    }
  }

  async markUnavailable(id: string): Promise<Vehicle> {
    try {
      const vehicle = await this.vehicleModel
        .findByIdAndUpdate(id, { disponible: false }, { new: true })
        .exec();

      if (!vehicle || vehicle.deleted) {
        throw new NotFoundException('Véhicule introuvable');
      }
      return vehicle;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Erreur lors de la mise à jour de la disponibilité: ${error.message}`,
      );
    }
  }
}
