import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { Vehicle } from '@prisma/client';
import { CreateVehicleDto } from 'src/modules/vehicules/dto/create-vehicule.dto';
import { UpdateVehicleDto } from 'src/modules/vehicules/dto/update-vehicule.dto';
import { AgenciesService } from '../../agencies/services/agencies.service';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agenciesService: AgenciesService,
  ) {}

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    try {
      const agencies = await this.agenciesService.findAll({ isActive: true, limit: 1 });
      if (!agencies.data || agencies.data.length === 0) {
        throw new InternalServerErrorException('Aucune agence active trouvée');
      }
      const activeAgency = agencies.data[0];

      return await this.prisma.vehicle.create({
        data: {
          ...dto,
          agenceId: activeAgency.id,
          deleted: false,
          disponible: true,
          promotionCandidate: dto.promotionCandidate ?? false,
          photos: dto.photos ?? [],
        },
      });
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        `Erreur lors de la création du véhicule: ${getErrorMessage(error)}`,
      );
    }
  }

  async findAll(): Promise<Vehicle[]> {
    try {
      return await this.prisma.vehicle.findMany({ where: { deleted: false } });
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        `Erreur lors de la récupération des véhicules: ${getErrorMessage(error)}`,
      );
    }
  }

  async findPromotions(): Promise<Vehicle[]> {
    try {
      return await this.prisma.vehicle.findMany({
        where: { deleted: false, prix: { lt: 20000 } },
      });
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        `Erreur lors de la récupération des promotions: ${getErrorMessage(error)}`,
      );
    }
  }

  async findOne(id: number): Promise<Vehicle> {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
      if (!vehicle || vehicle.deleted) {
        throw new NotFoundException('Véhicule introuvable');
      }
      return vehicle;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Erreur lors de la récupération du véhicule: ${getErrorMessage(error)}`,
      );
    }
  }

  async update(id: number, dto: UpdateVehicleDto): Promise<Vehicle> {
    try {
      const vehicle = await this.prisma.vehicle.update({
        where: { id },
        data: dto as any,
      });
      if (!vehicle || vehicle.deleted) {
        throw new NotFoundException('Véhicule introuvable');
      }
      return vehicle;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Erreur lors de la mise à jour du véhicule: ${getErrorMessage(error)}`,
      );
    }
  }

  async remove(id: number): Promise<Vehicle> {
    try {
      return await this.prisma.vehicle.update({
        where: { id },
        data: { deleted: true, deletedAt: new Date() },
      });
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        `Erreur lors de la suppression du véhicule: ${getErrorMessage(error)}`,
      );
    }
  }

  async addPhoto(id: number, photoUrl: string): Promise<Vehicle> {
    try {
      const vehicle = await this.findOne(id);
      return await this.prisma.vehicle.update({
        where: { id },
        data: { photos: [...vehicle.photos, photoUrl] },
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Erreur lors de l’ajout de la photo: ${getErrorMessage(error)}`,
      );
    }
  }

  async findAvailable(): Promise<Vehicle[]> {
    try {
      return await this.prisma.vehicle.findMany({
        where: {
          deleted: false,
          disponible: true,
          promotionCandidate: false,
        },
      });
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        `Erreur lors de la récupération des véhicules disponibles: ${getErrorMessage(error)}`,
      );
    }
  }

  async markUnavailable(id: number): Promise<Vehicle> {
    try {
      return await this.prisma.vehicle.update({
        where: { id },
        data: { disponible: false },
      });
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        `Erreur lors de la mise à jour de la disponibilité: ${getErrorMessage(error)}`,
      );
    }
  }
}

