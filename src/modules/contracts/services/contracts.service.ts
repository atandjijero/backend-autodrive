import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contract, ContractDocument, ContractStatus } from '../schemas/contract.schema';
import { CreateContractDto } from '../dto/create-contract.dto';
import { UpdateContractDto } from '../dto/update-contract.dto';
import { ValidateContractDto } from '../dto/validate-contract.dto';
import { MailService } from '../../../shared/mail.service';
import { AgenciesService } from '../../agencies/services/agencies.service';
import { VehicleDocument } from '../../vehicules/schemas/vehicule.schema';

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name)
    private contractModel: Model<ContractDocument>,
    @InjectModel('Vehicle')
    private vehicleModel: Model<VehicleDocument>,
    private readonly mailService: MailService,
    private readonly agenciesService: AgenciesService,
  ) {}

  async create(createContractDto: CreateContractDto, user: any): Promise<ContractDocument> {
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
      const vehicle = await this.vehicleModel.findById(createContractDto.vehicleId);
      if (!vehicle || vehicle.deleted || !vehicle.disponible) {
        throw new NotFoundException('Véhicule non disponible');
      }

      // Vérifier qu'il n'y a pas de conflit de dates pour ce véhicule
      const conflictingContract = await this.contractModel.findOne({
        vehicleId: createContractDto.vehicleId,
        statut: { $in: [ContractStatus.Pending, ContractStatus.Approved] },
        deleted: false,
        $or: [
          {
            dateDebut: { $lte: dateFin },
            dateFin: { $gte: dateDebut }
          }
        ]
      });

      if (conflictingContract) {
        throw new BadRequestException('Ce véhicule n\'est pas disponible pour ces dates');
      }
    }

    const contract = new this.contractModel({
      userId: user.userId,
      vehicleId: createContractDto.vehicleId ? new Types.ObjectId(createContractDto.vehicleId) : undefined,
      dateDebut,
      dateFin,
      montantTotal: createContractDto.montantTotal,
      acompteVerse: createContractDto.acompteVerse || 0,
      conditionsSpeciales: createContractDto.conditionsSpeciales,
      statut: ContractStatus.Pending,
    });

    return await contract.save();
  }

  async findAll(user: any): Promise<ContractDocument[]> {
    let filter: any = { deleted: false };

    // Si ce n'est pas un admin, ne montrer que ses propres contrats
    if (user.role !== 'admin') {
      filter.userId = user.userId;
    }

    return this.contractModel
      .find(filter)
      .populate('userId', 'nom prenom email telephone role')
      .populate('vehicleId', 'marque modele immatriculation prix photos')
      .populate('validePar', 'nom prenom')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, user: any): Promise<ContractDocument> {
    const contract = await this.contractModel
      .findById(id)
      .populate('userId', 'nom prenom email telephone role')
      .populate('vehicleId', 'marque modele immatriculation prix photos')
      .populate('validePar', 'nom prenom')
      .exec();

    if (!contract || contract.deleted) {
      throw new NotFoundException('Contrat introuvable');
    }

    // Vérifier que l'utilisateur peut voir ce contrat
    const contractUserId = typeof contract.userId === 'object' ? contract.userId._id : contract.userId;
    const userIdToCompare = user.userId instanceof Types.ObjectId ? user.userId.toString() : String(user.userId);
    const contractUserIdStr = contractUserId instanceof Types.ObjectId ? contractUserId.toString() : String(contractUserId);
    
    if (user.role !== 'admin' && contractUserIdStr !== userIdToCompare) {
      throw new ForbiddenException('Accès non autorisé à ce contrat');
    }

    return contract;
  }

  async update(id: string, updateContractDto: UpdateContractDto, user: any): Promise<ContractDocument> {
    const contract = await this.findOne(id, user);

    // Seuls les admins peuvent changer le statut
    if (updateContractDto.statut && user.role !== 'admin') {
      throw new ForbiddenException('Seul un administrateur peut changer le statut du contrat');
    }

    // Si un vehicleId est fourni lors de la mise à jour, vérifier qu'il est valide
    if (updateContractDto.vehicleId) {
      const vehicle = await this.vehicleModel.findById(updateContractDto.vehicleId);
      if (!vehicle || vehicle.deleted || !vehicle.disponible) {
        throw new NotFoundException('Véhicule non disponible');
      }
    }

    // Appliquer les changements fournis
    Object.assign(contract, updateContractDto);

    // Si on approuve le contrat, mettre à jour la date de validation et l'admin valideur
    if (updateContractDto.statut === ContractStatus.Approved && contract.statut !== ContractStatus.Approved) {
      contract.dateValidation = new Date();
      contract.validePar = user.userId;
    }

    return await contract.save();
  }

  async delete(id: string, user: any): Promise<void> {
    const contract = await this.findOne(id, user);

    // Seuls les admins peuvent supprimer définitivement
    if (user.role !== 'admin') {
      throw new ForbiddenException('Seul un administrateur peut supprimer un contrat');
    }

    contract.deleted = true;
    contract.deletedAt = new Date();
    await contract.save();
  }

  async validateContract(id: string, validateContractDto: ValidateContractDto, user: any): Promise<ContractDocument> {
    // Vérifier que l'utilisateur est admin
    if (user.role !== 'admin') {
      throw new ForbiddenException('Seul un administrateur peut valider ou rejeter un contrat');
    }

    const contract = await this.contractModel.findById(id);

    if (!contract || contract.deleted) {
      throw new NotFoundException('Contrat introuvable');
    }

    // Vérifier que le contrat est en attente de validation
    if (contract.statut !== ContractStatus.Pending) {
      throw new BadRequestException('Ce contrat ne peut pas être validé ou rejeté (statut actuel: ' + contract.statut + ')');
    }

    // Appliquer la décision
    if (validateContractDto.valider) {
      contract.statut = ContractStatus.Approved;
    } else {
      contract.statut = ContractStatus.Rejected;
    }

    // Ajouter les informations de validation
    contract.dateValidation = new Date();
    contract.validePar = user.userId;
    if (validateContractDto.commentaires) {
      contract.commentaires = validateContractDto.commentaires;
    }

    const saved = await contract.save();

    // Envoyer un email à l'utilisateur pour l'informer de la décision
    try {
      // récupérer les informations utilisateur pour l'email
      const populated = await this.contractModel.findById(saved._id).populate('userId', 'nom prenom email').exec();
      const userObj: any = populated?.userId || null;

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
          contract.statut === ContractStatus.Approved,
          saved._id.toString(),
          agency || (saved as any).agenceNom ? { name: (saved as any).agenceNom, address: (saved as any).agenceAdresse, phone: (saved as any).agenceTelephone, email: (saved as any).agenceEmail } : null,
          mapsUrl,
          validateContractDto.commentaires,
        );
      }

    } catch (err) {
      // Ne pas bloquer l'opération si l'email échoue
      console.error('Erreur lors de l\'envoi de l\'email de validation de contrat:', err);
    }

    return saved;
  }

  async getContractForPDF(id: string, user: any): Promise<ContractDocument> {
    const contract = await this.findOne(id, user);

    // Vérifier que le contrat est approuvé
    if (contract.statut !== ContractStatus.Approved) {
      throw new BadRequestException('Le contrat doit être approuvé pour générer un reçu');
    }

    return contract;
  }
}