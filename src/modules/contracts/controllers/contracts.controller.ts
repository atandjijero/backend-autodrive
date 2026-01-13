import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';
import { ContractsService } from '../services/contracts.service';
import { CreateContractDto } from '../dto/create-contract.dto';
import { UpdateContractDto } from '../dto/update-contract.dto';
import { ValidateContractDto } from '../dto/validate-contract.dto';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { AdminGuard } from '../../../auth/guards/admin.guard';
import { CurrentUser } from '../../../auth/current-user.decorator';
import { isValidObjectId } from 'mongoose';

@ApiTags('contracts')
@ApiBearerAuth()
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Créer un nouveau contrat (Entreprises uniquement)' })
  @ApiResponse({ status: 201, description: 'Contrat créé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Réservé aux entreprises' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  create(@Body() createContractDto: CreateContractDto, @CurrentUser() user: any) {
    if (createContractDto.vehicleId && !isValidObjectId(createContractDto.vehicleId)) {
      throw new BadRequestException('ID de véhicule invalide');
    }
    return this.contractsService.create(createContractDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Lister les contrats' })
  @ApiResponse({ status: 200, description: 'Liste des contrats retournée' })
  findAll(@CurrentUser() user: any) {
    return this.contractsService.findAll(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/download')
  @ApiOperation({ summary: 'Récupérer les données du contrat pour la génération de PDF (Frontend)' })
  @ApiParam({ name: 'id', description: 'ID du contrat' })
  @ApiResponse({ status: 200, description: 'Données du contrat retournées pour génération PDF' })
  @ApiResponse({ status: 400, description: 'Contrat non approuvé' })
  @ApiResponse({ status: 404, description: 'Contrat introuvable' })
  async downloadContract(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de contrat invalide');
    }

    const contract = await this.contractsService.getContractForPDF(id, user);
    return contract;
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(':id/validate')
  @ApiOperation({ summary: 'Valider ou rejeter un contrat (Admin uniquement)' })
  @ApiParam({ name: 'id', description: 'ID du contrat' })
  @ApiBody({ type: ValidateContractDto })
  @ApiResponse({ status: 200, description: 'Contrat validé ou rejeté avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Réservé aux admins' })
  @ApiResponse({ status: 404, description: 'Contrat introuvable' })
  validate(
    @Param('id') id: string,
    @Body() validateContractDto: ValidateContractDto,
    @CurrentUser() user: any
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de contrat invalide');
    }
    return this.contractsService.validateContract(id, validateContractDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiParam({ name: 'id', description: 'ID du contrat' })
  @ApiResponse({ status: 200, description: 'Contrat trouvé' })
  @ApiResponse({ status: 404, description: 'Contrat introuvable' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de contrat invalide');
    }
    return this.contractsService.findOne(id, user);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un contrat (Admin uniquement)' })
  @ApiResponse({ status: 404, description: 'Contrat introuvable' })
  update(
    @Param('id') id: string,
    @Body() updateContractDto: UpdateContractDto,
    @CurrentUser() user: any
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de contrat invalide');
    }
    return this.contractsService.update(id, updateContractDto, user);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un contrat (Admin uniquement)' })
  @ApiParam({ name: 'id', description: 'ID du contrat' })
  @ApiResponse({ status: 200, description: 'Contrat supprimé' })
  @ApiResponse({ status: 404, description: 'Contrat introuvable' })
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID de contrat invalide');
    }
    return this.contractsService.delete(id, user);
  }
}
