-- DropForeignKey
ALTER TABLE "PhotoCard" DROP CONSTRAINT "PhotoCard_creatorId_fkey";

-- AlterTable
ALTER TABLE "UserPoint" ALTER COLUMN "points" SET DEFAULT 10;

-- AddForeignKey
ALTER TABLE "PhotoCard" ADD CONSTRAINT "PhotoCard_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
