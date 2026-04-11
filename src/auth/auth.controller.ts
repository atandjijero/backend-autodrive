import { Body, Controller, Post, Get, Patch, Param, ParseIntPipe, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiBody, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { CurrentUser } from './current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nom: { type: 'string' },
        prenom: { type: 'string' },
        email: { type: 'string' },
        motPasse: { type: 'string' },
        telephone: { type: 'string' },
        telephoneSecondaire: { type: 'string' },
        adresse: { type: 'string' },
        role: { type: 'string' },
        photo: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  async register(@Body() dto: CreateUserDto, @UploadedFile() photo?: Express.Multer.File) {
    const photoUrl = photo ? await this.auth.uploadProfilePhoto(photo) : undefined;
    return this.auth.register(dto, photoUrl);
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

  @Post('verify-email')
  @ApiResponse({ status: 200, description: 'Email vérifié avec succès' })
  verifyEmail(@Body('token') token: string) {
    return this.auth.verifyEmail(token);
  }

  // Récupération du profil utilisateur connecté
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() //  Swagger : ajoute le bouton "Authorize"
  @Get('profil')
  @ApiResponse({ status: 200, description: 'Profil de l’utilisateur connecté' })
  async getProfile(@CurrentUser() user: any) {
    return this.auth.getProfile(user.userId);
  }

  @Patch('profil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nom: { type: 'string' },
        prenom: { type: 'string' },
        email: { type: 'string' },
        telephone: { type: 'string' },
        telephoneSecondaire: { type: 'string' },
        adresse: { type: 'string' },
        photo: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Profil mis à jour avec succès' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateUserDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    let photoUrl: string | undefined;
    if (photo) {
      photoUrl = await this.auth.uploadProfilePhoto(photo);
    }
    return this.auth.updateProfile(user.userId, dto, photoUrl);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs' })
  async getUsers() {
    return this.auth.listUsers();
  }

  @Patch('users/:id/block')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Utilisateur bloqué' })
  async blockUser(@Param('id', ParseIntPipe) id: number, @CurrentUser() currentUser: any) {
    return this.auth.setUserBlocked(id.toString(), true, currentUser.role);
  }

  @Patch('users/:id/unblock')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Utilisateur débloqué' })
  async unblockUser(@Param('id', ParseIntPipe) id: number, @CurrentUser() currentUser: any) {
    return this.auth.setUserBlocked(id.toString(), false, currentUser.role);
  }

  @Patch('users/:id/role')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiBody({ schema: { type: 'object', properties: { role: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Rôle mis à jour' })
  async updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('role') role: string,
    @CurrentUser() currentUser: any
  ) {
    return this.auth.updateUserRole(id.toString(), role, currentUser.role);
  }

  @Post('invite-tester')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Invitation envoyée' })
  async inviteTester(@Body('email') email: string, @CurrentUser() currentUser: any) {
    return this.auth.inviteTester(email, currentUser.role);
  }
}
