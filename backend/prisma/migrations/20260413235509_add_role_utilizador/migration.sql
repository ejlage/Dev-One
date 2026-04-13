-- AlterTable
ALTER TABLE "utilizador" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'utilizador',
ALTER COLUMN "estado" SET DEFAULT true,
ALTER COLUMN "telemovel" SET DATA TYPE VARCHAR(20);
