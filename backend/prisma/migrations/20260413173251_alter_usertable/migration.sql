/*
  Warnings:

  - You are about to drop the column `role` on the `utilizador` table. All the data in the column will be lost.
  - Changed the type of `telemovel` on the `utilizador` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "utilizador" DROP COLUMN "role",
DROP COLUMN "telemovel",
ADD COLUMN     "telemovel" INTEGER NOT NULL,
ALTER COLUMN "estado" DROP DEFAULT;
