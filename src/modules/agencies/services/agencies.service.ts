import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { Agency } from '@prisma/client';
import { CreateAgencyDto } from '../dto/create-agency.dto';
import { UpdateAgencyDto } from '../dto/update-agency.dto';

@Injectable()
export class AgenciesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAgencyDto): Promise<Agency> {
    const { location, ...agencyData } = dto;
    let locationJson: any = null;

    if (location) {
      const lat = typeof location.latitude === 'string' ? parseFloat(location.latitude) : location.latitude;
      const lng = typeof location.longitude === 'string' ? parseFloat(location.longitude) : location.longitude;
      if (!isNaN(lat) && !isNaN(lng)) {
        locationJson = { latitude: lat, longitude: lng };
      }
    }

    return this.prisma.agency.create({
      data: {
        ...agencyData,
        location: locationJson,
      },
    });
  }

  async update(id: number, dto: UpdateAgencyDto): Promise<Agency> {
    const { location, ...updateData } = dto;
    let locationJson: any = undefined;

    if (location) {
      const lat = typeof location.latitude === 'string' ? parseFloat(location.latitude) : location.latitude;
      const lng = typeof location.longitude === 'string' ? parseFloat(location.longitude) : location.longitude;
      if (!isNaN(lat) && !isNaN(lng)) {
        locationJson = { latitude: lat, longitude: lng };
      }
    }

    try {
      return await this.prisma.agency.update({
        where: { id },
        data: {
          ...(updateData as any),
          ...(locationJson && { location: locationJson }),
        },
      });

    } catch (error) {
      throw new NotFoundException('Agency not found');
    }
  }

  async delete(id: number): Promise<{ success: boolean }> {
    try {
      await this.prisma.agency.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      throw new NotFoundException('Agency not found');
    }
  }

  async findById(id: number): Promise<Agency> {
    const agency = await this.prisma.agency.findUnique({ where: { id } });
    if (!agency) throw new NotFoundException('Agency not found');
    return agency;
  }

  async findAll(opts: { page?: number; limit?: number; q?: string; isActive?: boolean } = {}): Promise<{ data: Agency[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.max(1, Math.min(100, opts.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (opts.isActive !== undefined) where.isActive = opts.isActive;
    if (opts.q) {
      where.OR = [
        { name: { contains: opts.q, mode: 'insensitive' } },
        { city: { contains: opts.q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.agency.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.agency.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async toggleActive(id: number): Promise<Agency> {
    const agency = await this.findById(id);
    return this.prisma.agency.update({
      where: { id },
      data: { isActive: !agency.isActive },
    });
  }

  async findNearbyAgencies(longitude: number, latitude: number, maxDistance: number = 10000, limit: number = 10): Promise<Agency[]> {
    // For simplicity with Prisma/Postgres without PostGIS enabled yet, we return all active agencies
    // and sort them by distance in memory if needed, or just return them for now.
    // In a real production app with PostGIS, we would use a raw query.
    return this.prisma.agency.findMany({
      where: { isActive: true },
      take: limit,
    });
  }
}