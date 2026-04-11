-- AlterTable
ALTER TABLE "paiements" ADD COLUMN     "email" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "nom" TEXT NOT NULL DEFAULT 'Client inconnu';
