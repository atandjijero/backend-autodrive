import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { ContactStatus } from '@prisma/client';
import { CreateContactDto } from '../dto/create-contact.dto';
import { MailService } from 'src/shared/mail.service';

@Injectable()
export class ContactService {
  constructor(
    private prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async createContact(dto: CreateContactDto) {
    return this.prisma.contact.create({
      data: {
        nom: dto.nom,
        email: dto.email,
        telephone: dto.telephone,
        sujet: dto.sujet,
        message: dto.message,
        status: ContactStatus.pending,
      },
    });
  }

  async getAllContacts() {
    return this.prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async respondToContact(id: string, response: string) {
    try {
      const contact = await this.prisma.contact.update({
        where: { id: parseInt(id) },
        data: {
          response,
          status: ContactStatus.responded,
          respondedAt: new Date(),
        },
      });

      // Envoyer un email de réponse à l'utilisateur
      await this.mailService.sendContactResponse(
        contact.email,
        contact.nom,
        contact.message,
        response,
      );

      return contact;
    } catch (error) {
      throw new NotFoundException('Message de contact introuvable');
    }
  }
}