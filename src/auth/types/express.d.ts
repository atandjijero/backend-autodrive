import { AuthenticatedUser } from 'src/auth/types/auth.types';

declare global {
  namespace Express {
    // On étend l'interface existante au lieu de la redéfinir
    interface User extends AuthenticatedUser {}

    interface Request {
      user?: User;
    }
  }
}
