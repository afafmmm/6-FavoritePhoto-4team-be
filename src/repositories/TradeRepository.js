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

    // 1. 판매자 입장: 교환 제안 카드들을 소유하게 됨
    await tx.userCard.updateMany({
      where: { id: { in: offeredCardIds } },
      data: {
        ownerId: tradeRequest.ownerId,
        status: 'ACTIVE'
      }
    });

    // 2. 구매자 입장: 판매자의 카드 중 하나를 소유하게 됨
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

    // 3. 거래 요청 상태를 ACCEPTED로 변경 (혹시 알림에 따로 필요할까 싶어 넣긴함)
    await tx.tradeRequest.update({
      where: { id: tradeRequestId },
      data: { tradeStatus: 'ACCEPTED' }
    });

    return { message: '교환이 완료되었습니다.' };
  });
}

// 우주님 레포에도 있는 것 같습니다..
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
