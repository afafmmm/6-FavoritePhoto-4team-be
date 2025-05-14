/*
  Warnings:

  - Added the required column `totalQuantity` to the `PhotoCard` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserCard" DROP CONSTRAINT "UserCard_ownerId_fkey";

-- AlterTable
ALTER TABLE "PhotoCard" ADD COLUMN     "totalQuantity" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "UserCard" ALTER COLUMN "ownerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
