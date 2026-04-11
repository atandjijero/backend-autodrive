import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Role } from '@prisma/client';
import { MailService } from 'src/shared/mail.service';
import { CloudinaryService } from 'src/shared/cloudinary.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const OTP_EXPIRATION = 5 * 60 * 1000; // 5 minutes
const RESET_TOKEN_EXPIRATION = 60 * 60 * 1000; // 1 heure

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private mailService: MailService,
    private cloudinaryService: CloudinaryService,
  ) {}

  //  Inscription
  async register(dto: CreateUserDto, photoUrl?: string) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('Email déjà utilisé');

    const hash = await bcrypt.hash(dto.motPasse, 10);
    const isAdmin = dto.role === Role.admin;

    const user = await this.prisma.user.create({
      data: {
        nom: dto.nom,
        prenom: dto.prenom,
        email: dto.email,
        motPasse: hash,
        telephone: dto.telephone,
        telephoneSecondaire: dto.telephoneSecondaire,
        adresse: dto.adresse,
        photo: photoUrl ?? dto.photo,
        role: dto.role as Role,
        isVerified: isAdmin ? true : false,
      },
    });

    const { motPasse, verificationToken, verificationTokenExpires, ...safeUser } = user;
    return {
      message: isAdmin
        ? 'Utilisateur créé avec succès. Le compte admin est activé sans vérification email.'
        : 'Utilisateur créé avec succès. Connectez-vous pour recevoir votre OTP de première connexion.',
      user: safeUser,
    };
  }

  //  Connexion avec OTP si première fois
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } }) as any;
    if (!user || !(await bcrypt.compare(dto.motPasse, user.motPasse))) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    if (user.blocked) {
      throw new ForbiddenException('Compte bloqué');
    }

    if (!user.isVerified) {
      const otp = crypto.randomInt(100000, 999999).toString();
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          otpCode: otp,
          otpExpires: new Date(Date.now() + OTP_EXPIRATION),
        },
      });

      await this.mailService.sendOtp(user.email, otp);
      return { message: 'OTP envoyé. Vérifiez votre email.', requiresOtp: true };
    }

    return this.issueToken(user);
  }

  //  Vérification OTP
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } }) as any;
    if (!user) {
      throw new UnauthorizedException('OTP invalide ou expiré');
    }

    if (user.blocked) {
      throw new ForbiddenException('Compte bloqué');
    }

    if (
      user.otpCode !== dto.otp ||
      !user.otpExpires || 
      user.otpExpires < new Date()
    ) {
      throw new UnauthorizedException('OTP invalide ou expiré');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpires: null,
      },
    });

    return this.issueToken(user);
  }

  //  Forgot Password
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: new Date(Date.now() + RESET_TOKEN_EXPIRATION),
      },
    });

    await this.mailService.sendResetLink(user.email, token);
    return { message: 'Lien de réinitialisation envoyé à votre email' };
  }

  //  Reset Password avec confirmation
  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: dto.token,
        resetPasswordExpires: { gt: new Date() },
      },
    });
    if (!user) throw new BadRequestException('Token invalide ou expiré');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        motPasse: await bcrypt.hash(dto.newPassword, 10),
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  //  Vérification email
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpires: { gt: new Date() },
      },
    });
    if (!user) throw new BadRequestException('Token de vérification invalide ou expiré');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    return {
      message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.',
      redirectTo: '/auth/login' // URL de redirection vers la page de connexion
    };
  }

  //  Génération JWT
   issueToken(user: any) {
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwt.sign(payload),
      id: user.id.toString(),   
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
    };
  }


  //  Récupération du profil utilisateur connecté
  async getProfile(userId: string) {
    const id = parseInt(userId);
    if (isNaN(id)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        telephoneSecondaire: true,
        adresse: true,
        photo: true,
        role: true,
        dateInscription: true,
        isVerified: true,
        temoignages: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    return user;
  }

  async listUsers() {
    return this.prisma.user.findMany({
      where: { deleted: false },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        isVerified: true,
        blocked: true,
        photo: true,
        dateInscription: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setUserBlocked(userId: string, blocked: boolean, currentUserRole?: string) {
    // Les testeurs n'ont pas le droit de bloquer/débloquer des utilisateurs
    if (currentUserRole === 'testeur') {
      throw new ForbiddenException('Les testeurs n\'ont pas les permissions pour bloquer ou débloquer des utilisateurs');
    }

    const id = parseInt(userId, 10);
    if (isNaN(id)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        blocked,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        isVerified: true,
        blocked: true,
        dateInscription: true,
        updatedAt: true,
      },
    });
  }

  async updateUserRole(userId: string, role: string, currentUserRole?: string) {
    // Les testeurs n'ont pas le droit de modifier les rôles
    if (currentUserRole === 'testeur') {
      throw new ForbiddenException('Les testeurs n\'ont pas les permissions pour modifier les rôles des utilisateurs');
    }

    const id = parseInt(userId, 10);
    if (isNaN(id)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    const validRoles = ['admin', 'client', 'entreprise', 'tourist', 'testeur'];
    if (!validRoles.includes(role)) {
      throw new BadRequestException('Rôle invalide');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        role: role as any,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        isVerified: true,
        blocked: true,
        dateInscription: true,
        updatedAt: true,
      },
    });
  }

  async inviteTester(email: string, currentUserRole?: string) {
    // Les testeurs n'ont pas le droit d'envoyer des invitations
    if (currentUserRole === 'testeur') {
      throw new ForbiddenException('Les testeurs n\'ont pas les permissions pour envoyer des invitations');
    }

    // Vérifier si l'email est valide
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Email invalide');
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('Un utilisateur avec cet email existe déjà');
    }

    // Générer un lien d'invitation
    const inviteToken = this.jwt.sign(
      { email, role: 'testeur', type: 'invite' },
      { expiresIn: '7d' }
    );

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/inscription?invite=${inviteToken}`;

    // Envoyer l'email
    await this.mailService.sendCustomMail(
      email,
      'Invitation à tester AutoDrive',
      `
        <h1>Invitation à tester AutoDrive</h1>
        <p>Vous avez été invité à tester notre application AutoDrive en tant que testeur.</p>
        <p>Cliquez sur le lien ci-dessous pour vous inscrire :</p>
        <a href="${inviteLink}">S'inscrire en tant que testeur</a>
        <p>Ce lien expire dans 7 jours.</p>
      `
    );

    return { message: 'Invitation envoyée avec succès' };
  }

  async updateProfile(userId: string, dto: UpdateUserDto, photoUrl?: string) {
    const id = parseInt(userId);
    if (isNaN(id)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    if (dto.email) {
      const exists = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          id: { not: id },
        },
      });
      if (exists) {
        throw new BadRequestException('Cette adresse email est déjà utilisée');
      }
    }

    const updateData: any = {
      nom: dto.nom,
      prenom: dto.prenom,
      email: dto.email,
      telephone: dto.telephone,
      telephoneSecondaire: dto.telephoneSecondaire,
      adresse: dto.adresse,
      photo: photoUrl ?? dto.photo,
    };

    const user = await this.prisma.user.update({
      where: { id },
      data: Object.fromEntries(
        Object.entries(updateData).filter(([, value]) => value !== undefined),
      ),
    });

    const { motPasse, otpCode, resetPasswordToken, resetPasswordExpires, verificationToken, verificationTokenExpires, ...safeUser } = user;
    return safeUser;
  }

  async uploadProfilePhoto(file: Express.Multer.File): Promise<string> {
    return this.cloudinaryService.uploadImage(file, 'profile_pictures');
  }
}
