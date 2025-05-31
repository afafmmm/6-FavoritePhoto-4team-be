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

async function findTradeRequestsByApplicant(applicantId) {
  return prisma.tradeRequest.findMany({
    where: { applicantId },
    include: {
      applicant: {
        select: {
          id: true,
          nickname: true,
          profileImage: true,
        }
      },
      photoCard: {
        include: {
          creator: true  
        }
      },
      tradeRequestUserCards: {
        include: {
          userCard: {
            include: {
              photoCard: {
                include: {
                  creator: true  
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}




export default {
  findSaleByPhotoCardId,
  findUserCardsByIds,
  cancelTradeRequest,
  findTradeRequestById,
  findTradeRequestsByApplicant
};