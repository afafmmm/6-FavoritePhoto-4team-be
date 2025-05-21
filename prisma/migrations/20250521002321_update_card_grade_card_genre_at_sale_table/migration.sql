/*
  Warnings:

  - You are about to drop the column `desiredGenre` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `desiredGrade` on the `Sale` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "desiredGenre",
DROP COLUMN "desiredGrade",
ADD COLUMN     "cardGenreId" INTEGER,
ADD COLUMN     "cardGradeId" INTEGER;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_cardGradeId_fkey" FOREIGN KEY ("cardGradeId") REFERENCES "CardGrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_cardGenreId_fkey" FOREIGN KEY ("cardGenreId") REFERENCES "CardGenre"("id") ON DELETE SET NULL ON UPDATE CASCADE;
