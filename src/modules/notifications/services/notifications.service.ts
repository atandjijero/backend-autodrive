import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { Contact, ContactStatus } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async getUnreadContactsCount(): Promise<number> {
    return this.prisma.contact.count({
      where: { status: ContactStatus.pending }
    });
  }

  async listUnread(): Promise<Contact[]> {
    return this.prisma.contact.findMany({
      where: { status: ContactStatus.pending },
      orderBy: { createdAt: 'desc' }
    });
  }

  async listAll(): Promise<Contact[]> {
    return this.prisma.contact.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }
}