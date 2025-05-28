import prisma from '../config/prisma.js';
async function findSaleByPhotoCardId(photoCardId) {
  return prisma.sale.findFirst({
    where: {
      photoCardId,
      status: { in: ['AVAILABLE'] }
    }
  });
}

async function findUserCardsByIds(userId, userCardIds) {
  return prisma.userCard.findMany({
    where: {
      id: { in: userCardIds },
      ownerId: userId,
      status: 'ACTIVE'
    }
  });
}

//거래 요청
async function createTradeRequest({ photoCardId, ownerId, applicantId, offeredPhotoCardId, description }) {
  const [tradeRequest] = await prisma.$transaction([
    prisma.tradeRequest.create({
      data: {
        photoCardId,
        ownerId,
        applicantId,
        offeredPhotoCardId,
        description,
        tradeStatus: 'AVAILABLE'
      }
    }),
    prisma.sale.updateMany({
      where: {
        photoCardId,
        status: 'AVAILABLE'
      },
      data: {
        status: 'PENDING'
      }
    })
  ]);

  return tradeRequest;
}

async function createTradeRequestUserCards(tradeRequestId, userCardIds) {
  const createPromises = userCardIds.map((userCardId) =>
    prisma.tradeRequestUserCard.create({
      data: {
        tradeRequestId,
        userCardId
      }
    })
  );
  return Promise.all(createPromises);
}

async function updateUserCardsStatus(userCardIds, status) {
  return prisma.userCard.updateMany({
    where: {
      id: { in: userCardIds }
    },
    data: {
      status
    }
  });
}

async function cancelTradeRequest(tradeRequestId) {
  return prisma.$transaction(async (tx) => {
    const updatedTradeRequest = await tx.tradeRequest.update({
      where: { id: tradeRequestId },
      data: { tradeStatus: 'CANCELED' }
    });

    const tradeRequestUserCards = await tx.tradeRequestUserCard.findMany({
      where: { tradeRequestId },
      select: { userCardId: true }
    });

    const userCardIds = tradeRequestUserCards.map((item) => item.userCardId);

    await tx.userCard.updateMany({
      where: { id: { in: userCardIds } },
      data: { status: 'ACTIVE' }
    });

    return updatedTradeRequest;
  });
}

async function findTradeRequestById(id) {
  return prisma.tradeRequest.findUnique({
    where: { id },
    include: {
      tradeRequestUserCards: true
    }
  });
}


export default {
  findSaleByPhotoCardId,
  findUserCardsByIds,
  createTradeRequest,
  createTradeRequestUserCards,
  updateUserCardsStatus,
  cancelTradeRequest,
  findTradeRequestById
};