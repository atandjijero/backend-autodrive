import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  register(@Body() dto: CreateUserDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Connexion réussie ou OTP requis' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('verify-otp')
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: 'OTP vérifié et utilisateur authentifié' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto);
  }

  @Post('forgot-password')
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Lien de réinitialisation envoyé' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Mot de passe réinitialisé avec succès' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  // Récupération du profil utilisateur connecté
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() //  Swagger : ajoute le bouton "Authorize"
  @Get('profil')
  @ApiResponse({ status: 200, description: 'Profil de l’utilisateur connecté' })
  async getProfile(@CurrentUser() user: any) {
    return this.auth.getProfile(user.userId);
  }
}
