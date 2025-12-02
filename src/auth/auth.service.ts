import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model,Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument } from 'src/auth/schemas/user.schema';
import { MailService } from 'src/shared/mail.service';
import { CreateUserDto } from './dto/create-user.dto';
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
    @InjectModel(User.name) private users: Model<UserDocument>,
    private mailService: MailService,
  ) {}

  //  Inscription
  async register(dto: CreateUserDto) {
    const exists = await this.users.findOne({ email: dto.email });
    if (exists) throw new BadRequestException('Email déjà utilisé');

    const hash = await bcrypt.hash(dto.motPasse, 10);
    const user = await this.users.create({ ...dto, motPasse: hash });

    const { motPasse, ...safeUser } = user.toObject();
    return { message: 'Utilisateur créé avec succès', user: safeUser };
  }

  //  Connexion avec OTP si première fois
  async login(dto: LoginDto) {
    const user = await this.users.findOne({ email: dto.email });
    if (!user || !(await bcrypt.compare(dto.motPasse, user.motPasse))) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    if (!user.isVerified) {
      const otp = crypto.randomInt(100000, 999999).toString();
      user.otpCode = otp;
      user.otpExpires = new Date(Date.now() + OTP_EXPIRATION);
      await user.save();

      await this.mailService.sendOtp(user.email, otp);
      return { message: 'OTP envoyé. Vérifiez votre email.', requiresOtp: true };
    }

    return this.issueToken(user);
  }

  //  Vérification OTP
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.users.findOne({ email: dto.email });
    if (
      !user ||
      user.otpCode !== dto.otp ||
      !user.otpExpires || 
      user.otpExpires < new Date()
    ) {
      throw new UnauthorizedException('OTP invalide ou expiré');
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    return this.issueToken(user);
  }

  //  Forgot Password
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.users.findOne({ email: dto.email });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_EXPIRATION);
    await user.save();

    await this.mailService.sendResetLink(user.email, token);
    return { message: 'Lien de réinitialisation envoyé à votre email' };
  }

  //  Reset Password avec confirmation
  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    const user = await this.users.findOne({
      resetPasswordToken: dto.token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) throw new BadRequestException('Token invalide ou expiré');

    user.motPasse = await bcrypt.hash(dto.newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  //  Génération JWT
   issueToken(user: User) {
    const payload = {
      sub: user._id?.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwt.sign(payload),
      id: user._id?.toString(),   
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
    };
  }

  //  Récupération du profil utilisateur connecté
  async getProfile(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    const user = await this.users.findById(userId).select('-motPasse -resetPasswordToken -otpCode');
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    return user;
}
}
