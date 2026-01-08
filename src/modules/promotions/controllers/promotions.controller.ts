import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PromotionsService } from 'src/modules/promotions/services/promotions.service';
import { CreatePromotionDto } from 'src/modules/promotions//dto/create-promotion.dto';
import { UpdatePromotionDto } from 'src/modules/promotions//dto/update-promotion.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
 import { isValidObjectId } from 'mongoose';
import { BadRequestException } from '@nestjs/common';


@ApiTags('promotions')
@ApiBearerAuth()
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle promotion' })
  @ApiResponse({ status: 201, description: 'Promotion créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  create(@Body() createPromotionDto: CreatePromotionDto) {
    return this.promotionsService.create(createPromotionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les promotions' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Liste des promotions retournée' })
  async findAll(@Query('activeOnly') activeOnly?: string) {
    if (activeOnly === 'true') {
      return this.promotionsService.findActive();
    }
    return this.promotionsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Lister les promotions actives' })
  @ApiResponse({ status: 200, description: 'Liste des promotions actives retournée' })
  findActive() {
    return this.promotionsService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une promotion par ID' })
  @ApiResponse({ status: 200, description: 'Promotion trouvée' })
  @ApiResponse({ status: 404, description: 'Promotion introuvable' })
  findById(@Param('id') id: string) {
    return this.promotionsService.findById(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Rechercher une promotion par code promo' })
  @ApiResponse({ status: 200, description: 'Promotion trouvée' })
  @ApiResponse({ status: 404, description: 'Code promo invalide ou expiré' })
  findByCode(@Param('code') code: string) {
    return this.promotionsService.findByCode(code);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une promotion' })
  @ApiResponse({ status: 200, description: 'Promotion mise à jour' })
  @ApiResponse({ status: 404, description: 'Promotion introuvable' })
  update(@Param('id') id: string, @Body() updatePromotionDto: UpdatePromotionDto) {
    return this.promotionsService.update(id, updatePromotionDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une promotion (soft delete)' })
  @ApiResponse({ status: 200, description: 'Promotion supprimée' })
  @ApiResponse({ status: 404, description: 'Promotion introuvable' })
  delete(@Param('id') id: string) {
    return this.promotionsService.delete(id);
  }


@Post(':id/appliquer')
appliquerPromotion(
  @Param('id') id: string,
  @Body() body: { montantBase: number; vehiculeId?: string }
) {
  if (!isValidObjectId(id)) {
    throw new BadRequestException('ID de promotion invalide');
  }

  return this.promotionsService.appliquerPromotion(
    id,
    body.montantBase,
    body.vehiculeId
  );
}

}