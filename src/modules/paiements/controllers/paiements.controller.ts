import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  Post, 
  UsePipes, 
  ValidationPipe,
  UseGuards,
  
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse,ApiBearerAuth} from '@nestjs/swagger';
import { PaiementsService } from '../services/paiements.service';
import { CreatePaiementDto } from '../dto/create-paiement.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@ApiTags('Paiements')
@ApiBearerAuth()
@Controller('paiements')
export class PaiementsController {
  constructor(private readonly paiementsService: PaiementsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un paiement pour une réservation' })
  @ApiResponse({ status: 201, description: 'Paiement créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  creerPaiement(@Body() data: CreatePaiementDto) {
    return this.paiementsService.creerPaiement(data);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Lister tous les paiements' })
  @ApiResponse({ status: 200, description: 'Liste des paiements retournée' })
  findAll() {
    return this.paiementsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un paiement par ID' })
  @ApiResponse({ status: 200, description: 'Paiement trouvé' })
  @ApiResponse({ status: 404, description: 'Paiement introuvable' })
  findById(@Param('id') id: string) {
    return this.paiementsService.findById(id);
  }
}
