<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

**AutoDrive Backend** - API REST NestJS pour une plateforme complète de location de véhicules avec authentification JWT, gestion des réservations, paiements Stripe et génération de documents PDF.

**Stack Technologique :**
- NestJS 11 + TypeScript 5.7
- MongoDB 8.20 + Mongoose 8.20
- JWT Authentication + Passport
- Stripe Integration
- jsPDF, Nodemailer, Multer

---

## Installation

### Prérequis
- Node.js v18+
- MongoDB 4.4+
- npm 9+ ou yarn 3+

### Setup

```bash
# Cloner et entrer dans le projet
git clone <repo-url>
cd autodrive-backend

# Installer les dépendances
npm install

# Créer le fichier .env à la racine
cat > .env << EOF
# MongoDB
MONGO_URI=mongodb://localhost:27017/autodrive

# JWT
JWT_SECRET=votre_secret_tres_securise_et_aleatoire_32_caracteres
JWT_EXPIRATION=24h

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=app_password

# Serveur
PORT=9000
NODE_ENV=development

# Fichiers
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
EOF
```

## Démarrage

```bash
# Mode développement (watch mode)
npm run start:dev

# Mode production
npm run start:prod

# Serveur démarre sur http://localhost:9000
# Swagger : http://localhost:9000/api/docs
```

## Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Couverture
npm run test:cov
```

## Build & Deploy

```bash
# Compiler
npm run build

# Vérifier la syntaxe
npm run lint

# Déploiement production
npm run start:prod
```

---

## Sécurité et Conformité

### ✅ Implémenté

| Feature | Status | Détail |
|---------|--------|--------|
| **Mots de passe** | ✅ | Hachés avec bcrypt (10 rounds) - voir `src/auth/auth.service.ts` |
| **Authentification** | ✅ | JWT + Passport - tokens signés avec secret |
| **OTP** | ✅ | Codes à 6 chiffres générés avec `crypto.randomInt` |
| **Reset tokens** | ✅ | Générés avec `crypto.randomBytes(32)` |
| **Validation entrées** | ✅ | class-validator + class-transformer |
| **CORS** | ✅ | Configuré pour domaines approuvés |

### ⚠️ À Implémenter

| Exigence | Status | Recommandation |
|----------|--------|-----------------|
| **HTTPS/TLS 1.2+** | ❌ | Ajouter reverse-proxy (Nginx/ALB) en prod OU configurer `httpsOptions` dans `src/main.ts` |
| **HSTS Headers** | ❌ | Installer `helmet` et ajouter dans `src/main.ts` : `app.use(helmet())` |
| **Autres security headers** | ❌ | X-Frame-Options, X-Content-Type-Options, CSP (via helmet) |
| **Chiffrement données sensibles** | ❌ | Numéros de carte stockés en clair - **À FIX** |
| **Key Management (KMS)** | ❌ | AWS KMS / Google Cloud KMS / Azure Key Vault si stockage local requis |
| **Rate limiting** | ❌ | `@nestjs/throttler` pour limiter tentatives login/API |
| **Logs audit** | ❌ | Logger les actions sensibles (login, paiements, accès admin) |

### 🔴 Problèmes Critiques

#### 1. **Numéros de carte stockés en clair** 
- **Fichier affecté :** `src/modules/paiements/*`
- **Problème :** `numeroCarte`, `cvv`, `expiration` sauvegardés tels quels dans MongoDB
- **Risque :** Accès non autorisé à la BD = vol de données

**Solutions :**

**Option A (Préférée) : Stripe Tokens**
```typescript
// Au lieu de stocker la carte, stocker le token Stripe
const token = await stripe.paymentMethods.create({
  type: 'card',
  card: { number, exp_month, exp_year, cvc }
});
// Stocker uniquement token.id
```

**Option B : Chiffrement AES-256 + KMS**
```bash
npm install crypto-js
```

#### 2. **Pas de HTTPS/HSTS en code**
- **Solution rapide :** Configurer reverse-proxy (Nginx) en prod
- **Solution code :** Voir snippet ci-dessous

#### 3. **Pas de rate limiting**
- **Risque :** Attaques brute force sur login
- **Solution :** Installer `@nestjs/throttler`

### 📝 Implémentation Recommandée

#### Ajouter Helmet + HSTS dans `src/main.ts`

```typescript
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 1. Security headers
  app.use(helmet());
  
  // 2. HSTS (Strict-Transport-Security)
  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 an
      includeSubDomains: true,
      preload: true,
    })
  );

  // 3. HTTPS redirection (si derrière un reverse proxy)
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && 
        req.get('x-forwarded-proto') !== 'https') {
      res.redirect(301, `https://${req.get('host')}${req.originalUrl}`);
    }
    next();
  });

  // ... reste de la config
  await app.listen(port);
}
```

#### Ajouter Rate Limiting

```bash
npm install @nestjs/throttler
```

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,      // 1 minute
      limit: 5,        // 5 tentatives max
    }]),
    // ... autres modules
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

#### Chiffrer les champs sensibles (Option AES-256)

```bash
npm install crypto-js @types/crypto-js
```

```typescript
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32+ chars, générée en KMS

export function encryptCard(cardNumber: string): string {
  return CryptoJS.AES.encrypt(cardNumber, ENCRYPTION_KEY).toString();
}

export function decryptCard(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

### 📋 Checklist Production

- [ ] Certificats SSL/TLS valides
- [ ] HTTPS forcé (reverse-proxy ou code)
- [ ] HSTS headers activés
- [ ] Rate limiting activé
- [ ] Helmet + security headers
- [ ] Chiffrement données sensibles
- [ ] KMS pour gestion des clés
- [ ] Logs d'audit activés
- [ ] Secrets en .env, jamais en code
- [ ] Backup MongoDB + uploads réguliers

---

## Architecture

```
src/
├── auth/                 # Authentification JWT + OTP
│   ├── auth.service.ts   # Logique bcrypt, JWT, tokens
│   ├── jwt.strategy.ts   # Passport JWT strategy
│   └── jwt-auth.guard.ts # Protection endpoints
├── modules/
│   ├── vehicules/        # Gestion véhicules
│   ├── agencies/         # Agences + géolocalisation
│   ├── reservations/     # Réservations + PDF reçu
│   ├── paiements/        # Paiements Stripe (⚠️ à sécuriser)
│   ├── promotions/       # Codes promo
│   ├── contracts/        # Contrats + PDF génération
│   ├── blog/             # Articles blog
│   ├── dashboard/        # Statistiques
│   └── contact/          # Formulaire contact
├── shared/
│   ├── mail.service.ts   # Nodemailer
│   └── mail.module.ts
├── app.module.ts         # Root module
└── main.ts               # Entry point (⚠️ ajouter helmet)
```

## API Endpoints

### Auth
```
POST   /auth/register              Créer compte
POST   /auth/login                 Connexion
POST   /auth/verify-otp            Vérifier OTP
POST   /auth/forgot-password       Demander reset
POST   /auth/reset-password        Réinitialiser pwd
```

### Véhicules
```
GET    /vehicles                   Lister (public)
GET    /vehicles/:id               Détails
POST   /vehicles                   Créer (admin)
PUT    /vehicles/:id               Modifier (admin)
DELETE /vehicles/:id               Supprimer (admin)
```

### Réservations
```
POST   /reservations               Créer réservation
GET    /reservations               Lister (admin)
GET    /reservations/:id           Détails
GET    /reservations/:id/recu      PDF reçu
DELETE /reservations/:id           Annuler
```

### Paiements
```
POST   /paiements                  Créer paiement
GET    /paiements                  Lister (admin)
GET    /paiements/:id              Détails
```

Pour la liste complète, consulter Swagger : `http://localhost:9000/api/docs`

## Modules et Services

- **Auth Service** : Inscription, connexion, JWT, OTP, reset password
- **Mail Service** : Nodemailer - emails de vérification et confirmations
- **Vehicles Service** : CRUD véhicules avec upload images
- **Reservations Service** : Création/gestion réservations avec validation
- **Paiements Service** : Paiements Stripe (à sécuriser)
- **Promotions Service** : Gestion codes promo et remises
- **Contracts Service** : Génération PDF contrats avec Stripe
- **Dashboard Service** : Statistiques réservations/revenus

## Resources

Pour en savoir plus sur NestJS :

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- Official video [courses](https://courses.nestjs.com/).
- Deploy with [NestJS Mau](https://mau.nestjs.com).
- Real-time app visualization : [NestJS Devtools](https://devtools.nestjs.com).

## Support

Cette documentation est maintenue par l'équipe AutoDrive. Pour toute question, consultez :
- La documentation Swagger : `http://localhost:9000/api/docs`
- Les logs serveur pour diagnostiquer les erreurs
- Le code source dans `/src`

## License

Propriétaire - AutoDrive 2026
