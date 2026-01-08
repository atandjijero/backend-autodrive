import { Body, Controller, Get, Post, Put, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { ContactService } from '../services/contact.service';
import { CreateContactDto } from '../dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async createContact(@Body() dto: CreateContactDto) {
    const contact = await this.contactService.createContact(dto);
    return { message: 'Message envoyé avec succès', contact };
  }

  @Get()
  async getAllContacts() {
    return this.contactService.getAllContacts();
  }

  @Put(':id/respond')
  async respondToContact(@Param('id') id: string, @Body('response') response: string) {
    return this.contactService.respondToContact(id, response);
  }
}