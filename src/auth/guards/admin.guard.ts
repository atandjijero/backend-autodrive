import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedUser } from 'src/auth/types/auth.types';
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const currentUser = request.user as AuthenticatedUser; 

    // Vérification de l’authentification
    if (!currentUser) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    /**
     * Dans AutoDrive :
     * - Seuls les utilisateurs avec le rôle ADMIN ont accès complet
     * - Les autres rôles (Client, Entreprise, Tourist) sont restreints
     */
    const allowedRoles: Role[] = [Role.admin];

    if (!allowedRoles.includes(currentUser.role)) {
      throw new ForbiddenException(
        'Accès réservé aux administrateurs uniquement'
      );
    }

    return true;
  }
}
