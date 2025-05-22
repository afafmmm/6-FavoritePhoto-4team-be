import prisma from "../config/prisma.js";

async function findAllCards() {
  return await prisma.photoCard.findMany();
}

async function findCardById(id) {
  return await prisma.photoCard.findUnique({
    where: { id },
  });
}

export default { findAllCards, findCardById };
1;
