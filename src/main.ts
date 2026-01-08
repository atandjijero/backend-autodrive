import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ConfigService pour lire .env
  const configService = app.get(ConfigService);
  //  Toujours exposer la racine ./uploads
  const uploadsPath = configService.get<string>('UPLOADS_PATH') || './uploads';

  // Configuration CORS (fronts autorisés)
  app.enableCors({
    origin: [
      'http://localhost:3000',   // React/Vue/Angular en dev
      'http://127.0.0.1:3000',   // Variante locale
      'http://10.0.2.2:3000',    // Android Emulator
      'http://localhost',        // Flutter web
      'http://127.0.0.1',        // Variante Flutter web
      'http://localhost:5173',   // Vite (React/Vue/Svelte)
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // Servir les fichiers statiques depuis le dossier uploads
  app.useStaticAssets(join(__dirname, '..', uploadsPath), {
    prefix: '/uploads/',
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('AutoDrive Backend API')
    .setDescription("Documentation de l'API AutoDrive (authentification, véhicules, réservations, etc.)")
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // supprime les champs non attendus
      forbidNonWhitelisted: false, // ignore les champs inconnus au lieu de rejeter
      transform: true,            // transforme les types automatiquement
    }),
  );

  // Démarrage du serveur
  const port = process.env.PORT || 9000;
  await app.listen(port);
  console.log(`🚀 AutoDrive backend démarré sur http://localhost:${port}`);
  console.log(`📑 Swagger disponible sur http://localhost:${port}/api/docs`);
  console.log(`📂 Fichiers uploadés accessibles sur http://localhost:${port}/uploads`);
}

void bootstrap();
