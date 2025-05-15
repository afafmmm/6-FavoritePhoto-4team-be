/*
  Warnings:

  - Added the required column `initialPrice` to the `PhotoCard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PhotoCard" ADD COLUMN     "initialPrice" INTEGER NOT NULL;
