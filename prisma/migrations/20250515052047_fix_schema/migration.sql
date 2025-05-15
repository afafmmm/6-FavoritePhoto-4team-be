/*
  Warnings:

  - The values [TRAVEL,LANDSCAPE,PORTRAIT,OBJECT] on the enum `CardGenre` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `price` to the `PhotoCard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remainingQuantity` to the `PhotoCard` table without a default value. This is not possible if the table is not empty.
  - Made the column `ownerId` on table `UserCard` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CardGenre_new" AS ENUM ('ALBUM', 'SPECIAL', 'FANSIGN', 'SEASON_GREETING', 'FANMEETING', 'CONCERT', 'MD', 'COLLABORATION', 'FANCLUB', 'ETC');
ALTER TABLE "PhotoCard" ALTER COLUMN "genre" TYPE "CardGenre_new" USING ("genre"::text::"CardGenre_new");
ALTER TYPE "CardGenre" RENAME TO "CardGenre_old";
ALTER TYPE "CardGenre_new" RENAME TO "CardGenre";
DROP TYPE "CardGenre_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "UserCard" DROP CONSTRAINT "UserCard_ownerId_fkey";

-- AlterTable
ALTER TABLE "PhotoCard" ADD COLUMN     "price" INTEGER NOT NULL,
ADD COLUMN     "remainingQuantity" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "UserCard" ALTER COLUMN "ownerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
