import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact, ContactDocument } from '../schemas/contact.schema';
import { CreateContactDto } from '../dto/create-contact.dto';
import { MailService } from 'src/shared/mail.service';

@Injectable()
export class ContactService {
  constructor(
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
    private readonly mailService: MailService,
  ) {}

  async createContact(dto: CreateContactDto): Promise<Contact> {
    const contact = new this.contactModel(dto);
    return contact.save();
  }

  async getAllContacts(): Promise<Contact[]> {
    return this.contactModel.find().sort({ createdAt: -1 }).exec();
  }

  async respondToContact(id: string, response: string): Promise<Contact> {
    const contact = await this.contactModel.findByIdAndUpdate(
      id,
      { response, status: 'responded', respondedAt: new Date() },
      { new: true },
    ).exec();
    if (!contact) throw new NotFoundException('Message de contact introuvable');

    // Envoyer un email de réponse à l'utilisateur
    await this.mailService.sendContactResponse(
      contact.email,
      contact.nom,
      contact.message,
      response,
    );

    return contact;
  }
}