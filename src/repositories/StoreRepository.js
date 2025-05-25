import prisma from "../config/prisma.js";

async function findAllCards() {
  return await prisma.photoCard.findMany({
    include: {
      _count: {
        select: {
          userCards: true,
          sales: true,
          targetTradeRequests: true,
          offeredTradeRequests: true,
        },
      },
    },
  });
}

async function countCardsByGrade() {
  const result = await prisma.photoCard.groupBy({
    by: ['gradeId'],
    _count: { _all: true },
  });

  return result.map(item => ({
    gradeId: item.gradeId,
    count: item._count._all,
  }));
}

async function countCardsByGenre() {
  const result = await prisma.photoCard.groupBy({
    by: ['genreId'],
    _count: { _all: true },
  });

  return result.map(item => ({
    genreId: item.genreId,
    count: item._count._all,
  }));
}

async function countCardsBySaleStatus() {
  const allCards = await prisma.photoCard.findMany({
    include: {
      _count: {
        select: {
          sales: true,
        },
      },
    },
  });

  let onSale = 0;
  let notOnSale = 0;

  allCards.forEach(card => {
    if (card._count.sales > 0) {
      onSale += 1;
    } else {
      notOnSale += 1;
    }
  });

  return [
    { isOnSale: true, count: onSale },
    { isOnSale: false, count: notOnSale },
  ];
}

async function findCardById(id) {
  return await prisma.photoCard.findUnique({
    where: { id },
  });
}

export default {
  findAllCards,
  countCardsByGrade,
  countCardsByGenre,
  countCardsBySaleStatus,
  findCardById,
};

