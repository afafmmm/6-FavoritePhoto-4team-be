/*
  Warnings:

  - The `status` column on the `UserCard` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tradeStatus` column on the `UserCard` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `grade` to the `PhotoCard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genre` to the `PhotoCard` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('ACTIVE', 'TRADED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('AVAILABLE', 'PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('AVAILABLE', 'SOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CardGrade" AS ENUM ('COMMON', 'RARE', 'SUPER_RARE', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "CardGenre" AS ENUM ('TRAVEL', 'LANDSCAPE', 'PORTRAIT', 'OBJECT');

-- AlterTable
ALTER TABLE "PhotoCard" DROP COLUMN "grade",
ADD COLUMN     "grade" "CardGrade" NOT NULL,
DROP COLUMN "genre",
ADD COLUMN     "genre" "CardGenre" NOT NULL;

-- AlterTable
ALTER TABLE "TradeRequest" ADD COLUMN     "tradeStatus" "TradeStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "UserCard" DROP COLUMN "status",
ADD COLUMN     "status" "CardStatus" NOT NULL DEFAULT 'ACTIVE',
DROP COLUMN "tradeStatus",
ADD COLUMN     "tradeStatus" "TradeStatus" NOT NULL DEFAULT 'AVAILABLE';

-- CreateTable
CREATE TABLE "Sale" (
    "id" SERIAL NOT NULL,
    "userCardId" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userCardId_fkey" FOREIGN KEY ("userCardId") REFERENCES "UserCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
