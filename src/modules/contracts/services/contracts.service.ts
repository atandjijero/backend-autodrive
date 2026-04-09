import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { ContractStatus } from '@prisma/client';
import { CreateContractDto } from '../dto/create-contract.dto';
import { UpdateContractDto } from '../dto/update-contract.dto';
import { ValidateContractDto } from '../dto/validate-contract.dto';
import { MailService } from '../../../shared/mail.service';
import { AgenciesService } from '../../agencies/services/agencies.service';
import { ReservationService } from '../../reservations/services/reservation.service';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly agenciesService: AgenciesService,
    private readonly reservationService: ReservationService,
  ) {}

  async create(createContractDto: CreateContractDto, user: any) {
    // Vérifier que l'utilisateur est une entreprise
    if (user.role !== 'entreprise') {
      throw new ForbiddenException('Seules les entreprises peuvent créer des contrats');
    }

    // Vérifier que user.userId existe
    if (!user.userId) {
      throw new BadRequestException('Utilisateur non authentifié');
    }

    // Vérifier que les dates sont valides
    const dateDebut = new Date(createContractDto.dateDebut);
    const dateFin = new Date(createContractDto.dateFin);

    if (dateFin <= dateDebut) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début');
    }

    // Vérifier que le véhicule existe et est disponible (si fourni)
    if (createContractDto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: createContractDto.vehicleId, deleted: false }
      });
      if (!vehicle || !vehicle.disponible) {
        throw new NotFoundException('Véhicule non disponible');
      }

      // Vérifier qu'il n'y a pas de conflit de dates pour ce véhicule
      const conflictingContract = await this.prisma.contract.findFirst({
        where: {
          vehicleId: createContractDto.vehicleId,
          statut: { in: [ContractStatus.pending, ContractStatus.approved] },
          deleted: false,
          OR: [
            {
              AND: [
                { dateDebut: { lte: dateFin } },
                { dateFin: { gte: dateDebut } }
              ]
            }
          ]
        }
      });

      if (conflictingContract) {
        throw new BadRequestException('Ce véhicule n\'est pas disponible pour ces dates');
      }
    }

    return await this.prisma.contract.create({
      data: {
        userId: user.userId,
        vehicleId: createContractDto.vehicleId,
        dateDebut,
        dateFin,
        montantTotal: createContractDto.montantTotal,
        acompteVerse: createContractDto.acompteVerse || 0,
        conditionsSpeciales: createContractDto.conditionsSpeciales,
        statut: ContractStatus.pending,
      },
      include: {
        user: { select: { nom: true, prenom: true, email: true, telephone: true, role: true } },
        vehicle: { select: { marque: true, modele: true, immatriculation: true, prix: true, photos: true } },
        valideParUser: { select: { nom: true, prenom: true } },
      },
    });
  }

  async findAll(user: any) {
    const where: any = { deleted: false };

    // Si ce n'est pas un admin, ne montrer que ses propres contrats
    if (user.role !== 'admin') {
      where.userId = user.userId;
    }

    return this.prisma.contract.findMany({
      where,
      include: {
        user: { select: { nom: true, prenom: true, email: true, telephone: true, role: true } },
        vehicle: { select: { marque: true, modele: true, immatriculation: true, prix: true, photos: true } },
        valideParUser: { select: { nom: true, prenom: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, user: any) {
    const contract = await this.prisma.contract.findUnique({
      where: { id, deleted: false },
      include: {
        user: { select: { nom: true, prenom: true, email: true, telephone: true, role: true } },
        vehicle: { select: { marque: true, modele: true, immatriculation: true, prix: true, photos: true } },
        valideParUser: { select: { nom: true, prenom: true } },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contrat introuvable');
    }

    // Vérifier que l'utilisateur peut voir ce contrat
    if (user.role !== 'admin' && contract.userId !== user.userId) {
      throw new ForbiddenException('Accès non autorisé à ce contrat');
    }

    return contract;
  }

  async update(id: number, updateContractDto: UpdateContractDto, user: any) {
    const contract = await this.findOne(id, user);

    // Seuls les admins peuvent changer le statut
    if (updateContractDto.statut && user.role !== 'admin') {
      throw new ForbiddenException('Seul un administrateur peut changer le statut du contrat');
    }

    // Si un vehicleId est fourni lors de la mise à jour, vérifier qu'il est valide
    if (updateContractDto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: updateContractDto.vehicleId, deleted: false }
      });
      if (!vehicle || !vehicle.disponible) {
        throw new NotFoundException('Véhicule non disponible');
      }
    }

    const updateData: any = { ...updateContractDto };

    // Si l'admin change le statut, enregistrer infos de validation
    const statutChange = updateContractDto.statut && updateContractDto.statut !== contract.statut;
    if (statutChange) {
      if (updateContractDto.statut === ContractStatus.approved || updateContractDto.statut === ContractStatus.rejected) {
        updateData.dateValidation = new Date();
        updateData.validePar = user.userId;
      }
      // Si approuvé, récupérer et assigner les infos agence pour le PDF
      if (updateContractDto.statut === ContractStatus.approved && this.agenciesService) {
        try {
          const res = await this.agenciesService.findAll({ isActive: true, limit: 1 });
          const agency = res && res.data && res.data.length ? res.data[0] : null;
          if (agency) {
            updateData.agenceNom = agency.name || 'AutoDrive';
            updateData.agenceAdresse = agency.address ? `${agency.address}${agency.city ? ', ' + agency.city : ''}${agency.postalCode ? ' - ' + agency.postalCode : ''}` : 'Adresse non spécifiée';
            updateData.agenceTelephone = agency.phone || 'Téléphone non spécifié';
            updateData.agenceEmail = agency.email || process.env.MAIL_USER || 'Email non spécifié';
            updateData.agenceLogo = agency.logo || undefined;
          } else {
            updateData.agenceNom = 'AutoDrive';
            updateData.agenceAdresse = 'Adresse non spécifiée';
            updateData.agenceTelephone = 'Téléphone non spécifié';
            updateData.agenceEmail = 'Email non spécifié';
            updateData.agenceLogo = undefined;
          }
        } catch (e) {
          updateData.agenceNom = 'AutoDrive';
          updateData.agenceAdresse = 'Adresse non spécifiée';
          updateData.agenceTelephone = 'Téléphone non spécifié';
          updateData.agenceEmail = 'Email non spécifié';
          updateData.agenceLogo = undefined;
        }
      }
    }

    const saved = await this.prisma.contract.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { nom: true, prenom: true, email: true } },
      },
    });

    // Si le statut a changé, envoyer le mail de notification (ne doit pas bloquer la réponse)
    if (statutChange) {
      try {
        const userObj = saved.user;

        // Récupérer l'agence active si possible
        let agency: any = null;
        let mapsUrl: string | undefined = undefined;
        if (this.agenciesService) {
          try {
            const res = await this.agenciesService.findAll({ isActive: true, limit: 1 });
            agency = res && res.data && res.data.length ? res.data[0] : null;
            if (agency && agency.location && agency.location.latitude && agency.location.longitude) {
              mapsUrl = `https://www.google.com/maps/search/?api=1&query=${agency.location.latitude},${agency.location.longitude}`;
            }
          } catch (e) {
            // ignore agency lookup errors
          }
        }

        if (this.mailService && userObj && userObj.email) {
          await this.mailService.sendContractValidation(
            userObj.email,
            `${userObj.nom || ''} ${userObj.prenom || ''}`.trim(),
            saved.statut === ContractStatus.approved,
            saved.id.toString(),
            agency || saved.agenceNom ? { name: saved.agenceNom, address: saved.agenceAdresse, phone: saved.agenceTelephone, email: saved.agenceEmail } : null,
            mapsUrl,
            updateContractDto.commentaires,
          );
        }
      } catch (err) {
        console.error('Erreur lors de l\'envoi de l\'email après mise à jour du contrat :', err);
      }
    }

    return saved;
  }

  async delete(id: number, user: any): Promise<void> {
    const contract = await this.findOne(id, user);

    // Seuls les admins peuvent supprimer définitivement
    if (user.role !== 'admin') {
      throw new ForbiddenException('Seul un administrateur peut supprimer un contrat');
    }

    await this.prisma.contract.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async validateContract(id: number, validateContractDto: ValidateContractDto, user: any) {
    // Vérifier que l'utilisateur est admin
    if (user.role !== 'admin') {
      throw new ForbiddenException('Seul un administrateur peut valider ou rejeter un contrat');
    }

    const contract = await this.prisma.contract.findUnique({
      where: { id, deleted: false },
      include: { user: { select: { nom: true, prenom: true, email: true } } },
    });

    if (!contract) {
      throw new NotFoundException('Contrat introuvable');
    }

    // Vérifier que le contrat est en attente de validation
    if (contract.statut !== ContractStatus.pending) {
      throw new BadRequestException('Ce contrat ne peut pas être validé ou rejeté (statut actuel: ' + contract.statut + ')');
    }

    // Appliquer la décision
    const newStatus = validateContractDto.valider ? ContractStatus.approved : ContractStatus.rejected;

    const updateData: any = {
      statut: newStatus,
      dateValidation: new Date(),
      validePar: user.userId,
    };

    if (validateContractDto.commentaires) {
      updateData.commentaires = validateContractDto.commentaires;
    }

    // Récupérer l'agence active pour les informations du PDF (si approuvé)
    let agency: any = null;
    let mapsUrl: string | undefined = undefined;
    if (newStatus === ContractStatus.approved && this.agenciesService) {
      try {
        const res = await this.agenciesService.findAll({ isActive: true, limit: 1 });
        agency = res && res.data && res.data.length ? res.data[0] : null;
        if (agency) {
          updateData.agenceNom = agency.name || 'AutoDrive';
          updateData.agenceAdresse = agency.address ? `${agency.address}${agency.city ? ', ' + agency.city : ''}${agency.postalCode ? ' - ' + agency.postalCode : ''}` : 'Adresse non spécifiée';
          updateData.agenceTelephone = agency.phone || 'Téléphone non spécifié';
          updateData.agenceEmail = agency.email || process.env.MAIL_USER || 'Email non spécifié';
          updateData.agenceLogo = agency.logo || undefined;
          if (agency.location && agency.location.latitude && agency.location.longitude) {
            mapsUrl = `https://www.google.com/maps/search/?api=1&query=${agency.location.latitude},${agency.location.longitude}`;
          }
        }
      } catch (e) {
        // ignore agency lookup errors, use defaults
        updateData.agenceNom = 'AutoDrive';
        updateData.agenceAdresse = 'Adresse non spécifiée';
        updateData.agenceTelephone = 'Téléphone non spécifié';
        updateData.agenceEmail = 'Email non spécifié';
        updateData.agenceLogo = undefined;
      }
    }

    const saved = await this.prisma.contract.update({
      where: { id },
      data: updateData,
      include: { user: { select: { nom: true, prenom: true, email: true } } },
    });

    // Envoyer un email à l'utilisateur pour l'informer de la décision
    try {
      const userObj = saved.user;

      if (this.mailService && userObj && userObj.email) {
        await this.mailService.sendContractValidation(
          userObj.email,
          `${userObj.nom || ''} ${userObj.prenom || ''}`.trim(),
          saved.statut === ContractStatus.approved,
          saved.id.toString(),
          agency || saved.agenceNom ? { name: saved.agenceNom, address: saved.agenceAdresse, phone: saved.agenceTelephone, email: saved.agenceEmail } : null,
          mapsUrl,
          validateContractDto.commentaires,
        );
      }

    } catch (err) {
      // Ne pas bloquer l'opération si l'email échoue
      console.error('Erreur lors de l\'envoi de l\'email de validation de contrat:', err);
    }

    // Si le contrat est approuvé et a un véhicule, créer automatiquement une réservation
    if (saved.statut === ContractStatus.approved && saved.vehicleId) {
      try {
        await this.reservationService.create({
          vehicleId: saved.vehicleId,
          clientId: saved.userId,
          dateDebut: saved.dateDebut.toISOString().split('T')[0], // Format YYYY-MM-DD
          dateFin: saved.dateFin.toISOString().split('T')[0],
          codePromo: undefined,
        });
        console.log(`Réservation créée automatiquement pour le contrat ${saved.id}`);
      } catch (err) {
        console.error('Erreur lors de la création automatique de la réservation:', err);
        // Ne pas bloquer l'approbation du contrat si la réservation échoue
      }
    }

    return saved;
  }

  async getContractForPDF(id: number, user: any) {
    const contract = await this.findOne(id, user);

    // Vérifier que le contrat est approuvé
    if (contract.statut !== ContractStatus.approved) {
      throw new BadRequestException('Le contrat doit être approuvé pour générer un reçu');
    }

    return contract;
  }
}