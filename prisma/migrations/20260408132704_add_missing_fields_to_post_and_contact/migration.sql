-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "response" TEXT;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "author" TEXT,
ADD COLUMN     "excerpt" TEXT,
ADD COLUMN     "featuredImage" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "promotions" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "dureeMinLocation" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "montantMinCommande" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "utilisationMax" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "utilisations" INTEGER NOT NULL DEFAULT 0;
