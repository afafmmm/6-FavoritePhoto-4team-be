/*
  Warnings:

  - You are about to drop the column `userCardId` on the `Sale` table. All the data in the column will be lost.
  - The `status` column on the `Sale` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `applicantCardId` on the `TradeRequest` table. All the data in the column will be lost.
  - You are about to drop the column `listedCardId` on the `TradeRequest` table. All the data in the column will be lost.
  - The `tradeStatus` column on the `TradeRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `UserCard` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `creatorId` to the `PhotoCard` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `grade` on the `PhotoCard` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `genre` on the `PhotoCard` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `photoCardId` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saleQuantity` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `applicantId` to the `TradeRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `offeredPhotoCardId` to the `TradeRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `TradeRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `photoCardId` to the `TradeRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_userCardId_fkey";

-- DropForeignKey
ALTER TABLE "TradeRequest" DROP CONSTRAINT "TradeRequest_applicantCardId_fkey";

-- DropForeignKey
ALTER TABLE "TradeRequest" DROP CONSTRAINT "TradeRequest_listedCardId_fkey";

-- AlterTable
ALTER TABLE "PhotoCard" ADD COLUMN     "creatorId" INTEGER NOT NULL,
DROP COLUMN "grade",
ADD COLUMN     "grade" TEXT NOT NULL,
DROP COLUMN "genre",
ADD COLUMN     "genre" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "userCardId",
ADD COLUMN     "desiredDescription" TEXT,
ADD COLUMN     "desiredGenre" TEXT,
ADD COLUMN     "desiredGrade" TEXT,
ADD COLUMN     "photoCardId" INTEGER NOT NULL,
ADD COLUMN     "saleQuantity" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "TradeRequest" DROP COLUMN "applicantCardId",
DROP COLUMN "listedCardId",
ADD COLUMN     "applicantId" INTEGER NOT NULL,
ADD COLUMN     "offeredPhotoCardId" INTEGER NOT NULL,
ADD COLUMN     "ownerId" INTEGER NOT NULL,
ADD COLUMN     "photoCardId" INTEGER NOT NULL,
DROP COLUMN "tradeStatus",
ADD COLUMN     "tradeStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "UserCard" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "UserPoint" ADD COLUMN     "todayClaimCount" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "CardGenre";

-- DropEnum
DROP TYPE "CardGrade";

-- DropEnum
DROP TYPE "Status";

-- CreateTable
CREATE TABLE "TradeRequestUserCard" (
    "id" SERIAL NOT NULL,
    "tradeRequestId" INTEGER NOT NULL,
    "userCardId" INTEGER NOT NULL,

    CONSTRAINT "TradeRequestUserCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleUserCard" (
    "id" SERIAL NOT NULL,
    "saleId" INTEGER NOT NULL,
    "userCardId" INTEGER NOT NULL,

    CONSTRAINT "SaleUserCard_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TradeRequest" ADD CONSTRAINT "TradeRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeRequest" ADD CONSTRAINT "TradeRequest_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeRequest" ADD CONSTRAINT "TradeRequest_photoCardId_fkey" FOREIGN KEY ("photoCardId") REFERENCES "PhotoCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeRequest" ADD CONSTRAINT "TradeRequest_offeredPhotoCardId_fkey" FOREIGN KEY ("offeredPhotoCardId") REFERENCES "PhotoCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeRequestUserCard" ADD CONSTRAINT "TradeRequestUserCard_tradeRequestId_fkey" FOREIGN KEY ("tradeRequestId") REFERENCES "TradeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeRequestUserCard" ADD CONSTRAINT "TradeRequestUserCard_userCardId_fkey" FOREIGN KEY ("userCardId") REFERENCES "UserCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_photoCardId_fkey" FOREIGN KEY ("photoCardId") REFERENCES "PhotoCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleUserCard" ADD CONSTRAINT "SaleUserCard_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleUserCard" ADD CONSTRAINT "SaleUserCard_userCardId_fkey" FOREIGN KEY ("userCardId") REFERENCES "UserCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
