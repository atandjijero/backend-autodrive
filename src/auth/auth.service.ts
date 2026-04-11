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
        : 'Utilisateur créé avec succès. Connectez-vous !',
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

    const frontendUrl = process.env.FRONTEND_URL || 'https://autodrive.com';
    const inviteLink = `${frontendUrl.replace(/\/$/, '')}/inscription?invite=${inviteToken}`;

    // Envoyer l'email
    await this.mailService.sendCustomMail(
      email,
      'Invitation exclusive à rejoindre AutoDrive',
      `
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;font-family:Arial,sans-serif;color:#333;">
          <tr>
            <td style="background:#004080;color:#fff;padding:20px;text-align:center;font-size:22px;font-weight:bold;">
              AutoDrive
            </td>
          </tr>
          <tr>
            <td style="padding:26px;">
              <p style="font-size:16px;margin-bottom:16px;">Bonjour,</p>
              <p style="font-size:15px;line-height:1.6;margin-bottom:18px;">
                Vous êtes invité à découvrir AutoDrive en tant que <strong>testeur privilégié</strong>.
                Rejoignez notre équipe pour tester les dernières fonctionnalités de l’application et nous aider à améliorer l’expérience utilisateur.
              </p>
              <p style="font-size:15px;line-height:1.6;margin-bottom:24px;">
                Cliquez sur le bouton ci-dessous pour finaliser votre inscription :
              </p>
              <p style="text-align:center;margin:24px 0;">
                <table align="center" cellpadding="0" cellspacing="0">
                  <tr>
                    <td bgcolor="#004080" style="border-radius:6px;">
                      <a href="${inviteLink}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:bold;color:#fff;text-decoration:none;">
                        S'inscrire en tant que testeur
                      </a>
                    </td>
                  </tr>
                </table>
              </p>
              <p style="font-size:14px;color:#555;line-height:1.6;margin-bottom:16px;">
                Ce lien est valable pendant <strong>7 jours</strong>. Après cette date, vous devrez demander une nouvelle invitation.
              </p>
              <p style="font-size:14px;color:#555;line-height:1.6;">
                Merci de votre intérêt pour AutoDrive. Nous sommes impatients de vous compter parmi nos testeurs.
              </p>
              <p style="margin-top:28px;font-size:14px;">
                Cordialement,<br/><strong>L'équipe AutoDrive</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f5f5f5;text-align:center;padding:14px;font-size:12px;color:#888;">
              © ${new Date().getFullYear()} AutoDrive. Tous droits réservés.
            </td>
          </tr>
        </table>
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

  async deleteUser(userId: string, currentUserRole: Role) {
    const id = parseInt(userId);
    if (isNaN(id)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Empêcher la suppression d'un admin par quelqu'un d'autre qu'un admin
    if (user.role === Role.admin && currentUserRole !== Role.admin) {
      throw new ForbiddenException('Seul un administrateur peut supprimer un autre administrateur');
    }

    // Empêcher la suppression de soi-même si on n'est pas admin (sauf si c'est un auto-suppression)
    if (user.id === parseInt(userId) && currentUserRole !== Role.admin) {
      // Pour l'auto-suppression, on permet
    } else if (currentUserRole !== Role.admin) {
      throw new ForbiddenException('Vous n\'avez pas les permissions pour supprimer cet utilisateur');
    }

    // Supprimer l'utilisateur
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Utilisateur supprimé avec succès' };
  }
}
