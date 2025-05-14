/*
  Warnings:

  - The `status` column on the `Sale` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tradeStatus` column on the `TradeRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `isListed` on the `UserCard` table. All the data in the column will be lost.
  - You are about to drop the column `totalQuantity` on the `UserCard` table. All the data in the column will be lost.
  - You are about to drop the column `tradeDescription` on the `UserCard` table. All the data in the column will be lost.
  - You are about to drop the column `tradeGenre` on the `UserCard` table. All the data in the column will be lost.
  - You are about to drop the column `tradeGrade` on the `UserCard` table. All the data in the column will be lost.
  - You are about to drop the column `tradeStatus` on the `UserCard` table. All the data in the column will be lost.
  - The `status` column on the `UserCard` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'TRADED', 'INACTIVE', 'AVAILABLE', 'PENDING', 'COMPLETED', 'SOLD', 'CANCELLED');

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "TradeRequest" DROP COLUMN "tradeStatus",
ADD COLUMN     "tradeStatus" "Status" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "UserCard" DROP COLUMN "isListed",
DROP COLUMN "totalQuantity",
DROP COLUMN "tradeDescription",
DROP COLUMN "tradeGenre",
DROP COLUMN "tradeGrade",
DROP COLUMN "tradeStatus",
DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';

-- DropEnum
DROP TYPE "CardStatus";

-- DropEnum
DROP TYPE "SaleStatus";

-- DropEnum
DROP TYPE "TradeStatus";
