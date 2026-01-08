import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { DashboardService } from 'src/modules/dashboard/services/dashboard.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { CreateTemoignageDto } from '../dto/create-temoignage.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getDashboard(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('temoignages/user')
  async getTemoignages(@CurrentUser() user: any) {
    return this.dashboardService.getTemoignages(user.userId);
  }

  @Get('temoignages')
  async getAllTemoignages() {
    return this.dashboardService.getAllTemoignages();
  }


  @UseGuards(JwtAuthGuard)
  @Post('temoignages')
  @ApiBody({ type: CreateTemoignageDto })
  async addTemoignage(
    @CurrentUser() user: any,
    @Body() dto: CreateTemoignageDto,
  ) {
    return this.dashboardService.addTemoignage(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('temoignages/:userId')
  @ApiParam({ name: 'userId', type: String })
  @ApiBody({ schema: { type: 'object', properties: { message: { type: 'string' } } } })
  async deleteTemoignage(
    @Param('userId') userId: string,
    @Body('message') message: string,
  ) {
    return this.dashboardService.deleteTemoignage(userId, message);
  }
}