import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { CreatePaiementDto } from '../dto/create-paiement.dto';
import { MethodePaiement, StatutPaiement, StatutReservation } from '@prisma/client';
import { MailService } from 'src/shared/mail.service';
import { PromotionsService } from 'src/modules/promotions/services/promotions.service';

@Injectable()
export class PaiementsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private promotionsService: PromotionsService,
  ) {}

  async creerPaiement(data: CreatePaiementDto) {
    try {
      // Vérifier que la réservation existe
      const reservation = await this.prisma.reservation.findUnique({
        where: { id: data.reservationId },
        include: {
          vehicle: true,
          promotion: true,
        },
      });

      if (!reservation) {
        throw new NotFoundException("La réservation associée est introuvable");
      }

      // Vérifier que la réservation est validée
      if (reservation.statut !== StatutReservation.validee) {
        throw new BadRequestException("La réservation doit être validée par un administrateur avant le paiement");
      }

      // Récupérer le prix du véhicule et calculer la durée
      const vehicle = reservation.vehicle;
      if (!vehicle || !vehicle.prix) {
        throw new BadRequestException("Le véhicule associé à cette réservation n'a pas de prix défini");
      }

      const start = new Date(reservation.dateDebut);
      const end = new Date(reservation.dateFin);
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / msPerDay);
      const days = diffDays > 0 ? diffDays : 1;
      const montantBaseCalcule = days * vehicle.prix;

      // Log pour debug (optionnel)
      console.log(`Paiement: Durée=${days} jours, Prix/Jour=${vehicle.prix}€, Total calculé=${montantBaseCalcule}€`);

      // Calculer la remise si une promotion est appliquée
      let montantRemise = 0;
      let promotionId: number | undefined;

      if (reservation.promotionId) {
        try {
          const result = await this.promotionsService.appliquerPromotion(
            reservation.promotionId,
            montantBaseCalcule,
            vehicle.id,
          );
          montantRemise = result.montantRemise;
          promotionId = reservation.promotionId;
        } catch (error) {
          // Si la promotion n'est plus valide, on continue sans remise
          console.warn('Promotion non applicable:', error instanceof Error ? error.message : String(error));
        }
      }

      // Calculer le montant final à payer (on utilise le montant calculé côté serveur)
      const montantFinal = Math.max(0, montantBaseCalcule - montantRemise);

      //  Vérification expiration carte si paiement par carte
      if (data.methodePaiement === MethodePaiement.CARTE && data.expiration) {
        const [month, year] = data.expiration.split('/').map(Number);
        const now = new Date();
        const expiryDate = new Date(2000 + year, month);

        if (expiryDate < now) {
          throw new BadRequestException("La carte est expirée");
        }
      }

      // Créer le paiement
      const saved = await this.prisma.paiement.create({
        data: {
          reservationId: data.reservationId,
          nom: data.nom,
          email: data.email,
          montant: montantFinal,
          methodePaiement: data.methodePaiement as MethodePaiement,
          statut: StatutPaiement.reussi,
        },
      });

      // Mettre à jour le statut de la réservation à "en cours" (Payée/Active)
      await this.prisma.reservation.update({
        where: { id: data.reservationId },
        data: { statut: StatutReservation.en_cours },
      });

      //  Envoi email confirmation
      await this.mailService.sendPaymentConfirmation(
        data.email,
        data.nom,
        data.montant,
      );

      return saved;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Erreur lors du traitement du paiement : " + (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  async findAll() {
    return this.prisma.paiement.findMany({
      include: {
        reservation: {
          include: {
            vehicle: true,
            client: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number) {
    const paiement = await this.prisma.paiement.findUnique({
      where: { id },
      include: {
        reservation: {
          include: {
            vehicle: true,
            client: true,
          },
        },
      },
    });

    if (!paiement) {
      throw new BadRequestException("Paiement introuvable");
    }

    return paiement;
  }
}
