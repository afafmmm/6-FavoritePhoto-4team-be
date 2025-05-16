/*
  Warnings:

  - You are about to drop the column `genre` on the `PhotoCard` table. All the data in the column will be lost.
  - You are about to drop the column `grade` on the `PhotoCard` table. All the data in the column will be lost.
  - Added the required column `genreId` to the `PhotoCard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gradeId` to the `PhotoCard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PhotoCard" DROP COLUMN "genre",
DROP COLUMN "grade",
ADD COLUMN     "genreId" INTEGER NOT NULL,
ADD COLUMN     "gradeId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "CardGenre" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardGenre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardGrade" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardGrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardGenre_name_key" ON "CardGenre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CardGrade_name_key" ON "CardGrade"("name");

-- AddForeignKey
ALTER TABLE "PhotoCard" ADD CONSTRAINT "PhotoCard_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "CardGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoCard" ADD CONSTRAINT "PhotoCard_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "CardGenre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
