# 📖 Guide Utilisateur - Backend AutoDrive

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Installation et démarrage](#installation-et-démarrage)
3. [Authentification](#authentification)
4. [Modules et fonctionnalités](#modules-et-fonctionnalités)
5. [Endpoints par module](#endpoints-par-module)
6. [Types de données](#types-de-données)
7. [Gestion des erreurs](#gestion-des-erreurs)
8. [Documentation interactice](#documentation-interactive)

---

## Vue d'ensemble

**AutoDrive Backend** est une API REST construite avec **NestJS** et **MongoDB**, conçue pour gérer une plateforme de location de véhicules. Elle offre des fonctionnalités complètes pour :

- ✅ Gestion des utilisateurs et authentification JWT
- ✅ Gestion des véhicules et des agences
- ✅ Système de réservations
- ✅ Traitement des paiements (Stripe intégré)
- ✅ Gestion des promotions et remises
- ✅ Blog et contenu
- ✅ Système de notifications
- ✅ Génération de rapports PDF
- ✅ Dashboard statistiques
- ✅ Gestion des contrats

**Stack technologique :**
- Backend : NestJS 11
- Base de données : MongoDB 8.20
- Authentification : JWT + Passport
- Paiements : Stripe
- Documentation API : Swagger
- PDF : PDFKit
- Excel : XLSX

---

## Installation et démarrage

### 1️⃣ Prérequis
- Node.js (v18+)
- MongoDB local ou distant
- npm ou yarn

### 2️⃣ Installation des dépendances
```bash
npm install
```

### 3️⃣ Configuration des variables d'environnement
Créez un fichier `.env` à la racine du projet :
```env
# Base de données
MONGO_URI=mongodb://localhost:27017/autodrive

# Authentification JWT
JWT_SECRET=votre_secret_jwt_tres_securise
JWT_EXPIRATION=24h

# Stripe (paiements)
STRIPE_SECRET_KEY=sk_test_...

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASSWORD=votre_mot_de_passe_app

# Serveur
PORT=3000
NODE_ENV=development
```

### 4️⃣ Démarrage du serveur

**Mode développement (avec rechargement automatique) :**
```bash
npm run start:dev
```

**Mode production :**
```bash
npm run start:prod
```

**Mode debug :**
```bash
npm run start:debug
```

### 5️⃣ Accès à la documentation Swagger
Une fois le serveur démarré, accédez à :
```
http://localhost:3000/api
```

---

## Authentification

### 🔐 Processus de connexion

Tous les endpoints protégés nécessitent un token JWT dans l'en-tête `Authorization` :

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 📝 Endpoints d'authentification

#### 1. Inscription
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "prenom": "Jean",
  "nom": "Dupont",
  "telephone": "+33612345678"
}
```

**Réponse (201) :**
```json
{
  "message": "Utilisateur créé avec succès",
  "userId": "507f1f77bcf86cd799439011"
}
```

---

#### 2. Connexion
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Réponse (200) :**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "role": "client"
  }
}
```

**Avec OTP (si activé) :**
```json
{
  "otpRequired": true,
  "message": "Un code OTP a été envoyé à votre email"
}
```

---

#### 3. Vérification OTP
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

---

#### 4. Réinitialisation de mot de passe
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Puis :**
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "newPassword": "NewPassword123"
}
```

---

## Modules et fonctionnalités

### 🚗 Véhicules (`/vehicles`)

#### Créer un véhicule (Admin)
```http
POST /vehicles
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "marque": "Toyota",
  "modele": "Corolla",
  "carrosserie": "sedan",
  "transmission": "automatique",
  "prix": 50.00,
  "immatriculation": "AB-123-CD",
  "file": <image.jpg>
}
```

#### Lister les véhicules
```http
GET /vehicles?page=1&limit=10&q=Toyota&available=true
```

#### Obtenir les détails d'un véhicule
```http
GET /vehicles/{vehicleId}
```

#### Modifier un véhicule (Admin)
```http
PUT /vehicles/{vehicleId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "prix": 55.00,
  "statut": "disponible"
}
```

#### Supprimer un véhicule (Admin)
```http
DELETE /vehicles/{vehicleId}
Authorization: Bearer {token}
```

---

### 📍 Agences (`/admin/agencies`)

#### Lister les agences avec pagination
```http
GET /admin/agencies?page=1&limit=10&q=Paris&isActive=true
```

#### Rechercher les agences proches (GPS)
```http
GET /admin/agencies/nearby?latitude=48.8566&longitude=2.3522&maxDistance=10000&limit=10
```

Retourne les agences dans un rayon de 10km (max 100km).

#### Créer une agence (Admin)
```http
POST /admin/agencies
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "nom": "AutoDrive Paris",
  "adresse": "123 Rue de la Paix",
  "codePostal": "75000",
  "ville": "Paris",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "telephone": "+33123456789",
  "email": "paris@autodrive.com",
  "horaires": "08:00-19:00",
  "file": <logo.jpg>,
  "isActive": true
}
```

#### Modifier une agence (Admin)
```http
PATCH /admin/agencies/{agencyId}
Authorization: Bearer {token}

{
  "telephone": "+33987654321",
  "horaires": "07:00-20:00"
}
```

#### Générer PDF d'agences
```http
GET /admin/agencies/{agencyId}/pdf
Authorization: Bearer {token}
```

---

### 📅 Réservations (`/reservations`)

#### Créer une réservation
```http
POST /reservations
Authorization: Bearer {token}
Content-Type: application/json

{
  "vehicleId": "507f1f77bcf86cd799439011",
  "dateDebut": "2026-02-01T10:00:00Z",
  "dateFin": "2026-02-05T10:00:00Z",
  "clientId": "507f1f77bcf86cd799439012",
  "agencyId": "507f1f77bcf86cd799439013"
}
```

**Réponse (201) :**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "vehicleId": "507f1f77bcf86cd799439011",
  "statut": "confirmee",
  "dateDebut": "2026-02-01T10:00:00Z",
  "dateFin": "2026-02-05T10:00:00Z",
  "prixTotal": 250.00,
  "createdAt": "2026-01-29T10:00:00Z"
}
```

#### Lister les réservations (Admin)
```http
GET /reservations
Authorization: Bearer {token}
```

#### Consulter une réservation
```http
GET /reservations/{reservationId}
Authorization: Bearer {token}
```

#### Obtenir le reçu PDF
```http
GET /reservations/{reservationId}/recu
Authorization: Bearer {token}
```

Retourne un PDF de la réservation prêt à l'impression.

#### Annuler une réservation
```http
DELETE /reservations/{reservationId}
Authorization: Bearer {token}
```

---

### 💳 Paiements (`/paiements`)

#### Créer un paiement
```http
POST /paiements
Authorization: Bearer {token}
Content-Type: application/json

{
  "reservationId": "507f1f77bcf86cd799439014",
  "nom": "Jean Dupont",
  "email": "jean@example.com",
  "montant": 250.00,
  "numeroCarte": "4242424242424242",
  "expiration": "12/25",
  "cvv": "123",
  "promotionId": "507f1f77bcf86cd799439015"
}
```

**Réponse (201) :**
```json
{
  "id": "507f1f77bcf86cd799439016",
  "reservationId": "507f1f77bcf86cd799439014",
  "statut": "reussi",
  "montant": 250.00,
  "montantRemise": 25.00,
  "createdAt": "2026-01-29T10:00:00Z"
}
```

#### Lister les paiements
```http
GET /paiements?page=1&limit=20
Authorization: Bearer {token}
```

#### Obtenir les détails d'un paiement
```http
GET /paiements/{paiementId}
Authorization: Bearer {token}
```

---

### 🎉 Promotions (`/promotions`)

#### Créer une promotion (Admin)
```http
POST /promotions
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "SUMMER50",
  "pourcentage": 50,
  "montantMax": 100.00,
  "dateDebut": "2026-06-01",
  "dateFin": "2026-08-31",
  "maxUtilisations": 1000,
  "isActive": true
}
```

#### Lister les promotions
```http
GET /promotions?isActive=true
```

#### Valider un code promotion
```http
POST /promotions/validate
Content-Type: application/json

{
  "code": "SUMMER50",
  "montantTotal": 100.00
}
```

**Réponse (200) :**
```json
{
  "valid": true,
  "promotion": {
    "id": "507f1f77bcf86cd799439015",
    "code": "SUMMER50",
    "pourcentage": 50,
    "remise": 50.00
  }
}
```

---

### 📞 Contact (`/contact`)

#### Envoyer un message de contact
```http
POST /contact
Content-Type: application/json

{
  "nom": "Jean Dupont",
  "email": "jean@example.com",
  "telephone": "+33612345678",
  "sujet": "Question sur location",
  "message": "Comment fonctionne la location ?"
}
```

#### Lister les messages (Admin)
```http
GET /contact
Authorization: Bearer {token}
```

---

### 📰 Blog (`/blog`)

#### Créer un article (Admin)
```http
POST /blog
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "titre": "Guide location voiture",
  "contenu": "Découvrez comment louer une voiture...",
  "auteur": "Admin",
  "file": <image.jpg>,
  "isPublished": true
}
```

#### Lister les articles
```http
GET /blog?page=1&limit=10&isPublished=true
```

#### Obtenir un article
```http
GET /blog/{postId}
```

#### Modifier un article (Admin)
```http
PUT /blog/{postId}
Authorization: Bearer {token}

{
  "titre": "Guide location voiture - Édition 2026",
  "contenu": "..."
}
```

#### Supprimer un article (Admin)
```http
DELETE /blog/{postId}
Authorization: Bearer {token}
```

---

### 📊 Dashboard et Statistiques (`/dashboard`, `/stats`)

#### Obtenir les statistiques du dashboard
```http
GET /dashboard
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "totalReservations": 150,
  "totalClients": 45,
  "chiffreAffaires": 15000.00,
  "vehiculesActifs": 30,
  "tauxUtilisation": 85.5,
  "reservationsParMois": [
    { "mois": "janvier", "total": 25 },
    { "mois": "février", "total": 35 }
  ]
}
```

#### Statistiques clients
```http
GET /stats
Authorization: Bearer {token}
```

---

### 🔔 Notifications (`/notifications`)

#### Lister les notifications
```http
GET /notifications
Authorization: Bearer {token}
```

#### Marquer une notification comme lue
```http
PUT /notifications/{notificationId}
Authorization: Bearer {token}

{
  "isRead": true
}
```

#### Supprimer une notification
```http
DELETE /notifications/{notificationId}
Authorization: Bearer {token}
```

---

### 📋 Contrats (`/contracts`)

#### Créer un contrat (Admin)
```http
POST /contracts
Authorization: Bearer {token}
Content-Type: application/json

{
  "numero": "CTR-2026-001",
  "clientId": "507f1f77bcf86cd799439012",
  "reservationId": "507f1f77bcf86cd799439014",
  "conditions": "Conditions standard de location...",
  "statut": "signe"
}
```

#### Lister les contrats
```http
GET /contracts
Authorization: Bearer {token}
```

#### Obtenir un contrat
```http
GET /contracts/{contractId}
Authorization: Bearer {token}
```

#### Générer PDF du contrat
```http
GET /contracts/{contractId}/pdf
Authorization: Bearer {token}
```

---

## Types de données

### Statut d'une réservation
```
- "en_attente"    : En attente de confirmation
- "confirmee"     : Confirmée et payée
- "en_cours"      : La location est en cours
- "terminee"      : La location est terminée
- "annulee"       : Annulée par le client
- "rejetee"       : Rejetée par l'admin
```

### Statut d'un paiement
```
- "reussi"        : Paiement réussi
- "echoue"        : Paiement échoué
```

### Transmission
```
- "manuelle"      : Boîte manuelle
- "automatique"   : Boîte automatique
```

### Carrosserie
```
- "berline"
- "suv"
- "monospace"
- "coupé"
- "cabriolet"
```

### Rôles utilisateur
```
- "client"        : Client standard
- "admin"         : Administrateur système
- "agence"        : Responsable d'agence
```

---

## Gestion des erreurs

L'API retourne des codes HTTP standardisés et des messages d'erreur structurés :

### 400 - Mauvaise requête
```json
{
  "statusCode": 400,
  "message": "Validation échouée",
  "error": {
    "email": "Email invalide",
    "dateDebut": "La date de début doit être dans le futur"
  }
}
```

### 401 - Non authentifié
```json
{
  "statusCode": 401,
  "message": "Authentification requise",
  "error": "Token invalide ou expiré"
}
```

### 403 - Accès refusé
```json
{
  "statusCode": 403,
  "message": "Accès refusé",
  "error": "Seuls les administrateurs peuvent accéder à cette ressource"
}
```

### 404 - Non trouvé
```json
{
  "statusCode": 404,
  "message": "Ressource non trouvée",
  "error": "Le véhicule avec l'ID xxx n'existe pas"
}
```

### 500 - Erreur serveur
```json
{
  "statusCode": 500,
  "message": "Erreur interne du serveur",
  "error": "Une erreur est survenue lors du traitement"
}
```

---

## Documentation interactive

### 📚 Swagger UI
Accédez à la documentation interactive complète :
```
http://localhost:3000/api
```

Vous pouvez :
- Consulter tous les endpoints
- Voir les modèles de données
- Tester les requêtes directement
- Visualiser les réponses

### 🧪 Tests unitaires
```bash
npm run test
```

### 🧪 Tests end-to-end
```bash
npm run test:e2e
```

### 📈 Couverture de code
```bash
npm run test:cov
```

---

## 🔧 Commandes utiles

```bash
# Démarrer le serveur en mode développement
npm run start:dev

# Vérifier et corriger le code
npm run lint

# Formatter le code
npm run format

# Builder le projet
npm build

# Lancer en production
npm run start:prod

# Lancer avec debug
npm run start:debug
```

---

## ⚙️ Configuration avancée

### Variables d'environnement supplémentaires

```env
# Mode
NODE_ENV=development|production

# Base de données
MONGO_URI=mongodb://localhost:27017/autodrive

# JWT
JWT_SECRET=votre_secret_très_sécurisé
JWT_EXPIRATION=24h

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASSWORD=app_password
EMAIL_FROM=noreply@autodrive.com

# Upload fichiers
MAX_FILE_SIZE=5242880  # 5MB
UPLOAD_PATH=./uploads

# Server
PORT=3000
HOST=localhost

# Logs
LOG_LEVEL=debug|info|warn|error
```

---

## 📞 Support et dépannage

### Problèmes courants

**1. Erreur de connexion MongoDB**
```
Solution : Vérifiez que MongoDB est en cours d'exécution et que MONGO_URI est correct
```

**2. Token JWT expiré**
```
Solution : Connectez-vous à nouveau pour obtenir un nouveau token
```

**3. Fichier trop volumineux à l'upload**
```
Solution : Vérifiez la limite MAX_FILE_SIZE et optimisez votre image
```

---

## 📝 Licence

MIT

---

**Dernière mise à jour** : 29 janvier 2026
