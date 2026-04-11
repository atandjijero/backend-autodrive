// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'defaultSecret', 
    });
  }

  async validate(payload: any) {
    const userId = parseInt(payload.sub, 10);
    if (isNaN(userId)) {
      throw new UnauthorizedException('Jeton invalide');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.blocked) {
      throw new UnauthorizedException('Compte bloqué ou utilisateur introuvable');
    }

    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
