import { AuthenticatedUser } from 'src/auth/types/auth.types';

declare global {
  namespace Express {
    // Étend le type User de Passport
    interface User extends AuthenticatedUser {}
  }
}
