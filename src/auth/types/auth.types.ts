import { Role } from 'src/auth/schemas/user.schema';

/**
 * Payload JWT (contenu du token signé)
 */
export interface JwtPayload {
  sub: string;          // identifiant utilisateur (Mongo ObjectId)
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  iat?: number;         // issued at
  exp?: number;         // expiration
}

/**
 * Utilisateur authentifié injecté dans req.user
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

/**
 * Extension de Express.Request pour inclure l'utilisateur
 * On fusionne avec Express.Request au lieu de redéfinir
 */
declare global {
  namespace Express {
    // On étend Request pour ajouter notre type AuthenticatedUser
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
