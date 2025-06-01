import prisma from '../config/prisma.js';

async function findTradeRequestsBySaleId(saleId) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId }
  });

  if (!sale) throw new Error('존재하지 않는 판매 항목입니다.');

  return prisma.tradeRequest.findMany({
    where: {
      photoCardId: sale.photoCardId,
      tradeStatus: 'PENDING'
    },
    include: {
      applicant: {
        select: {
          id: true,
          nickname: true,
          profileImage: true
        }
      },
      tradeRequestUserCards: {
        include: {
          userCard: {
            select: {
              id: true,
              photoCardId: true,
              ownerId: true,
              price: true,
              status: true,
              createdAt: true,
              photoCard: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  description: true,
                  gradeId: true,
                  genreId: true
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

async function acceptTradeRequest(tradeRequestId) {
  return prisma.$transaction(async (tx) => {
    const tradeRequest = await tx.tradeRequest.findUnique({
      where: { id: tradeRequestId },
      include: {
        tradeRequestUserCards: true,
        photoCard: true
      }
    });

    if (!tradeRequest) throw new Error('요청이 존재하지 않습니다.');

    const offeredCardIds = tradeRequest.tradeRequestUserCards.map((t) => t.userCardId);

    // 판매자 입장: 교환 제안 카드들을 소유하게 됨
    await tx.userCard.updateMany({
      where: { id: { in: offeredCardIds } },
      data: {
        ownerId: tradeRequest.ownerId,
        status: 'ACTIVE'
      }
    });

    // 구매자 입장: 판매자의 카드 중 하나를 소유하게 됨
    const availableCard = await tx.userCard.findFirst({
      where: {
        photoCardId: tradeRequest.photoCardId,
        status: 'AVAILABLE'
      }
    });

    if (!availableCard) throw new Error('판매자가 소유한 사용 가능한 카드가 없습니다.');

    await tx.userCard.update({
      where: { id: availableCard.id },
      data: {
        ownerId: tradeRequest.applicantId,
        status: 'ACTIVE'
      }
    });

    // 해당 카드의 Sale을 찾아 수량 감소
    const sale = await tx.sale.findFirst({
      where: {
        photoCardId: tradeRequest.photoCardId,
        sellerId: tradeRequest.ownerId,
        status: 'AVAILABLE'
      }
    });

    if (!sale) throw new Error('해당 카드에 대한 판매 정보가 존재하지 않습니다.');

    // 판매 수량 1 감소
    await tx.sale.update({
      where: { id: sale.id },
      data: {
        saleQuantity: {
          decrement: 1
        }
      }
    });

    // 거래 요청 상태를 ACCEPTED로 변경
    await tx.tradeRequest.update({
      where: { id: tradeRequestId },
      data: { tradeStatus: 'ACCEPTED' }
    });

    return { message: '교환이 완료되었습니다.' };
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
  findTradeRequestsBySaleId,
  acceptTradeRequest,
  findTradeRequestById
};
