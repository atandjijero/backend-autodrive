import { Role } from '@prisma/client';

/**
 * Payload JWT (contenu du token signé)
 */
export interface JwtPayload {
  sub: string;          // identifiant utilisateur (Prisma ID as string)
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  iat?: number;         // issued at
  exp?: number;         // expiration
}

/**
 * Utilisateur authentifié injecté dans req.user
 * Compatible avec Passport
 */
export interface AuthenticatedUser {
  sub: string;          // identifiant utilisateur (aligné avec JwtPayload)
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  isVerified: boolean;
  telephone: string;
}
