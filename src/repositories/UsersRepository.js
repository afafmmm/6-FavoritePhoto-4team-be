import prisma from "../config/prisma.js";

async function findGenre() {
  return await prisma.cardGenre.findMany({
    select: { id: true, name: true },
  });
}

async function findGrade() {
  return await prisma.cardGrade.findMany({
    select: { id: true, name: true },
  });
}

export default { findGenre, findGrade };
