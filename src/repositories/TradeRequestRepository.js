import prisma from "../config/prisma.js";

async function findSaleByPhotoCardId(photoCardId) {
  return prisma.sale.findFirst({
    where: { photoCardId, status: "AVAILABLE" },
  });
}

async function findUserCardsByIds(userId, userCardIds) {
  return prisma.userCard.findMany({
    where: {
      id: { in: userCardIds },
      ownerId: userId,
      status: "ACTIVE",
    },
  });
}

async function createTradeRequest({ photoCardId, ownerId, applicantId, offeredPhotoCardId, description }) {
  return prisma.tradeRequest.create({
    data: {
      photoCardId,
      ownerId,
      applicantId,
      offeredPhotoCardId,  
      description,
      tradeStatus: "PENDING",
    },
  });
}

async function createTradeRequestUserCards(tradeRequestId, userCardIds) {
  const createPromises = userCardIds.map((userCardId) =>
    prisma.tradeRequestUserCard.create({
      data: {
        tradeRequestId,
        userCardId,
      },
    })
  );
  return Promise.all(createPromises);
}

export default {
  findSaleByPhotoCardId,
  findUserCardsByIds,
  createTradeRequest,
  createTradeRequestUserCards,
};
