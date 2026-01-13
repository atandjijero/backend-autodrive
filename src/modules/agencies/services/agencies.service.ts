import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agency, AgencyDocument } from '../schemas/agency.schema';
import { CreateAgencyDto } from '../dto/create-agency.dto';
import { UpdateAgencyDto } from '../dto/update-agency.dto';

@Injectable()
export class AgenciesService {
  constructor(@InjectModel(Agency.name) private agencyModel: Model<AgencyDocument>) {}

  async create(dto: CreateAgencyDto): Promise<Agency> {

    // Préparer les données de l'agence en excluant location
    const { location, ...agencyData } = dto;

    // Gérer les coordonnées GPS séparément
    if (location) {
      // Convertir les strings en nombres si nécessaire
      const lat = typeof location.latitude === 'string' ? parseFloat(location.latitude) : location.latitude;
      const lng = typeof location.longitude === 'string' ? parseFloat(location.longitude) : location.longitude;

      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        (agencyData as any).location = {
          type: 'Point',
          coordinates: [lng, lat]
        };
      }
    } else {
    }

    const created = new this.agencyModel(agencyData);
    return created.save();
  }

  async update(id: string, dto: UpdateAgencyDto): Promise<Agency> {
    // Préparer les données de mise à jour en excluant location
    const { location, ...updateData } = dto;

    // Gérer les coordonnées GPS séparément
    if (location) {
      // Convertir les strings en nombres si nécessaire
      const lat = typeof location.latitude === 'string' ? parseFloat(location.latitude) : location.latitude;
      const lng = typeof location.longitude === 'string' ? parseFloat(location.longitude) : location.longitude;

      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        (updateData as any).location = {
          type: 'Point',
          coordinates: [lng, lat]
        };
      }
    }

    const updated = await this.agencyModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!updated) throw new NotFoundException('Agency not found');
    return updated;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const res = await this.agencyModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Agency not found');
    return { success: true };
  }

  async findById(id: string): Promise<Agency> {
    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new NotFoundException('Agency not found');
    }

    const agency = await this.agencyModel.findById(id).exec();
    if (!agency) throw new NotFoundException('Agency not found');

    // Convertir les coordonnées GeoJSON en format latitude/longitude
    const agencyObj = agency.toObject();
    if (agencyObj.location && agencyObj.location.coordinates) {
      (agencyObj as any).location = {
        latitude: agencyObj.location.coordinates[1],
        longitude: agencyObj.location.coordinates[0]
      };
    }

    return agencyObj as Agency;
  }

  async findAll(opts: { page?: number; limit?: number; q?: string; isActive?: boolean } = {}): Promise<{ data: Agency[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.max(1, Math.min(100, opts.limit || 10));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (opts.isActive !== undefined) filter.isActive = opts.isActive;

    let query = this.agencyModel.find(filter);

    if (opts.q) {
      query = this.agencyModel.find({ $and: [filter, { $text: { $search: opts.q } }] });
    }

    const [data, total] = await Promise.all([
      query.sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.agencyModel.countDocuments(filter).exec(),
    ]);

    // Convertir les coordonnées GeoJSON en format latitude/longitude
    const convertedData = data.map(agency => {
      const agencyObj = agency.toObject();
      if (agencyObj.location && agencyObj.location.coordinates) {
        (agencyObj as any).location = {
          latitude: agencyObj.location.coordinates[1],
          longitude: agencyObj.location.coordinates[0]
        };
      }
      return agencyObj as Agency;
    });

    return { data: convertedData, total, page, limit };
  }

  async toggleActive(id: string): Promise<Agency> {
    const agency = await this.agencyModel.findById(id).exec();
    if (!agency) throw new NotFoundException('Agency not found');
    const updated = await this.agencyModel.findByIdAndUpdate(id, { isActive: !agency.isActive }, { new: true }).exec();
    if (!updated) throw new NotFoundException('Agency not found');
    return updated;
  }

  async findNearbyAgencies(longitude: number, latitude: number, maxDistance: number = 10000, limit: number = 10): Promise<Agency[]> {
    try {
      const agencies = await this.agencyModel.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            distanceField: 'distance',
            maxDistance: maxDistance,
            spherical: true
          }
        },
        {
          $match: {
            isActive: true
          }
        },
        {
          $limit: limit
        }
      ]).exec();

      // Convertir les coordonnées GeoJSON en format latitude/longitude
      return agencies.map(agency => {
        if (agency.location && agency.location.coordinates) {
          agency.location = {
            latitude: agency.location.coordinates[1],
            longitude: agency.location.coordinates[0]
          };
        }
        return agency as Agency;
      });
    } catch (error) {
      console.error('Error finding nearby agencies:', error);
      // Retourner un tableau vide en cas d'erreur au lieu de planter
      return [];
    }
  }
}