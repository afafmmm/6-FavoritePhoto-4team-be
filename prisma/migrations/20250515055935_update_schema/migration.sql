/*
  Warnings:

  - The values [ALBUM,SPECIAL,FANSIGN,SEASON_GREETING,FANMEETING,CONCERT,MD,COLLABORATION,FANCLUB,ETC] on the enum `CardGenre` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `ownerId` on the `PhotoCard` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `PhotoCard` table. All the data in the column will be lost.
  - You are about to drop the column `remainingQuantity` on the `PhotoCard` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CardGenre_new" AS ENUM ('TRAVEL', 'LANDSCAPE', 'PORTRAIT', 'OBJECT');
ALTER TABLE "PhotoCard" ALTER COLUMN "genre" TYPE "CardGenre_new" USING ("genre"::text::"CardGenre_new");
ALTER TYPE "CardGenre" RENAME TO "CardGenre_old";
ALTER TYPE "CardGenre_new" RENAME TO "CardGenre";
DROP TYPE "CardGenre_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "PhotoCard" DROP CONSTRAINT "PhotoCard_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "UserCard" DROP CONSTRAINT "UserCard_ownerId_fkey";

-- AlterTable
ALTER TABLE "PhotoCard" DROP COLUMN "ownerId",
DROP COLUMN "price",
DROP COLUMN "remainingQuantity";

-- AlterTable
ALTER TABLE "UserCard" ALTER COLUMN "ownerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
