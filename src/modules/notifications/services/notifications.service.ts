import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact, ContactDocument } from 'src/modules/contact/schemas/contact.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
  ) {}

  async getUnreadContactsCount(): Promise<number> {
    return this.contactModel.countDocuments({ status: 'pending' }).exec();
  }

  async listUnread(): Promise<Contact[]> {
    return this.contactModel.find({ status: 'pending' }).sort({ createdAt: -1 }).exec();
  }

  async listAll(): Promise<Contact[]> {
    return this.contactModel.find().sort({ createdAt: -1 }).exec();
  }
}