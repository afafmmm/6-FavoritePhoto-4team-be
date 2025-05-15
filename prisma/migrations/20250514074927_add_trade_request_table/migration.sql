/*
  Warnings:

  - You are about to drop the column `totalSupply` on the `PhotoCard` table. All the data in the column will be lost.
  - You are about to drop the `MarketListing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TradeOffer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MarketListing" DROP CONSTRAINT "MarketListing_photoCardId_fkey";

-- DropForeignKey
ALTER TABLE "MarketListing" DROP CONSTRAINT "MarketListing_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "PhotoCard" DROP CONSTRAINT "PhotoCard_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "TradeOffer" DROP CONSTRAINT "TradeOffer_buyerId_fkey";

-- DropForeignKey
ALTER TABLE "TradeOffer" DROP CONSTRAINT "TradeOffer_offeredCardId_fkey";

-- DropForeignKey
ALTER TABLE "TradeOffer" DROP CONSTRAINT "TradeOffer_requestedCardId_fkey";

-- DropForeignKey
ALTER TABLE "TradeOffer" DROP CONSTRAINT "TradeOffer_sellerId_fkey";

-- AlterTable
ALTER TABLE "PhotoCard" DROP COLUMN "totalSupply",
ALTER COLUMN "ownerId" DROP NOT NULL;

-- DropTable
DROP TABLE "MarketListing";

-- DropTable
DROP TABLE "TradeOffer";

-- CreateTable
CREATE TABLE "UserCard" (
    "id" SERIAL NOT NULL,
    "photoCardId" INTEGER NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isListed" BOOLEAN NOT NULL DEFAULT false,
    "price" INTEGER,
    "totalQuantity" INTEGER,
    "tradeStatus" TEXT NOT NULL DEFAULT 'available',
    "tradeGrade" TEXT,
    "tradeGenre" TEXT,
    "tradeDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeRequest" (
    "id" SERIAL NOT NULL,
    "listedCardId" INTEGER NOT NULL,
    "applicantCardId" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PhotoCard" ADD CONSTRAINT "PhotoCard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_photoCardId_fkey" FOREIGN KEY ("photoCardId") REFERENCES "PhotoCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeRequest" ADD CONSTRAINT "TradeRequest_listedCardId_fkey" FOREIGN KEY ("listedCardId") REFERENCES "UserCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeRequest" ADD CONSTRAINT "TradeRequest_applicantCardId_fkey" FOREIGN KEY ("applicantCardId") REFERENCES "UserCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
