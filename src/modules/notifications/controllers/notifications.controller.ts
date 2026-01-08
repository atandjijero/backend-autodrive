import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { NotificationsService } from '../services/notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('unread')
  async listUnread() {
    // renvoie un tableau de notifications non-lues
    return this.notificationsService.listUnread();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  async listAll() {
    return this.notificationsService.listAll();
  }
}