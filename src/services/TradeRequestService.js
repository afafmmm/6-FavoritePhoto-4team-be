import prisma from '../config/prisma.js';
import tradeRequestRepository from '../repositories/TradeRequestRepository.js';
import Notification from './NotificationsService.js';

async function createTradeRequest({ saleId, applicantId, offeredUserCardIds, description }, io = null) {
  // sale 조회 (photoCardId, sellerId 포함)
  const targetSale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      photoCard: {
        include: {
          grade: true
        }
      }
    }
  });

  if (!targetSale || targetSale.status !== 'AVAILABLE') {
    throw new Error('유효하지 않거나 거래 가능한 상태가 아닌 판매 카드입니다.');
  }

  const photoCardId = targetSale.photoCardId;
  const ownerId = targetSale.sellerId;

  // 신청자가 제공하는 카드 소유 확인
  const ownedUserCards = await tradeRequestRepository.findUserCardsByIds(applicantId, offeredUserCardIds);
  if (ownedUserCards.length !== offeredUserCardIds.length) {
    throw new Error('신청자가 제공하는 카드 중 소유하지 않은 카드가 있습니다.');
  }

  const offeredPhotoCardId = ownedUserCards[0].photoCardId;

  // 트랜잭션으로 거래 요청 생성
  const tradeRequest = await prisma.$transaction(async (tx) => {
    const newTradeRequest = await tx.tradeRequest.create({
      data: {
        photoCardId,
        ownerId,
        applicantId,
        offeredPhotoCardId,
        description,
        tradeStatus: 'PENDING'
      }
    });

    await Promise.all(
      offeredUserCardIds.map((userCardId) =>
        tx.tradeRequestUserCard.create({
          data: {
            tradeRequestId: newTradeRequest.id,
            userCardId
          }
        })
      )
    );

    await tx.userCard.updateMany({
      where: { id: { in: offeredUserCardIds } },
      data: { status: 'PENDING' }
    });

    return newTradeRequest;
  });

  //거래 요청 생성 최종 단계(알림생성)
  try {
    const photoCardData = targetSale.photoCard;
    // applicantId로 사용자 닉네임 조회
    const applicantUser = await prisma.user.findUnique({
      where: { id: applicantId },
      select: { nickname: true }
    });
    const applicantName = applicantUser?.nickname || `닉네임 불러오기 실패`;
    const cardGrade = photoCardData?.grade?.name || '등급 불러오기 실패';
    const Message = `${applicantName}님이 [${cardGrade} | ${photoCardData.name}]의 포토카드 교환을 제안했습니다.`;
    await Notification.createNotification(
      {
        userId: ownerId,
        message: Message
      },
      io
    );
  } catch (e) {
    // 오류 발생 시 무시
    console.log('알림 생성 중 오류 발생:', e.message);
  }
  return tradeRequest;
}

//취소하기
async function cancelTradeRequest(tradeRequestId, userId) {
  const tradeRequest = await tradeRequestRepository.findTradeRequestById(tradeRequestId);
  console.log('tradeRequest.applicantId:', tradeRequest?.applicantId);
  console.log('userId:', userId);

  if (!tradeRequest) {
    throw new Error('존재하지 않는 교환 요청입니다.');
  }

  if (tradeRequest.applicantId !== userId) {
    throw new Error('본인의 요청만 취소할 수 있습니다.');
  }

  if (tradeRequest.tradeStatus !== 'PENDING') {
    throw new Error('취소할 수 없는 상태입니다.');
  }

  const canceled = await prisma.$transaction(async (tx) => {
    await tx.tradeRequest.update({
      where: { id: tradeRequestId },
      data: { tradeStatus: 'CANCELED' }
    });

    await tx.userCard.updateMany({
      where: {
        tradeRequestUserCards: {
          some: { tradeRequestId }
        }
      },
      data: { status: 'ACTIVE' }
    });

    await tx.sale.updateMany({
      where: { photoCardId: tradeRequest.photoCardId },
      data: { status: 'AVAILABLE' }
    });

    return true;
  });

  if (!canceled) {
    throw new Error('교환 요청 취소에 실패했습니다.');
  }

  return { message: '교환 요청이 취소되었습니다.' };
}

async function getTradeRequestsByApplicantAndCard(userId, saleId) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId }
  });

  if (!sale) {
    throw new Error('해당 saleId에 해당하는 판매 항목이 존재하지 않습니다.');
  }

  const requests = await prisma.tradeRequest.findMany({
    where: {
      applicantId: userId,
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
    orderBy: {
      createdAt: 'desc'
    }
  });

  return requests;
}

export default {
  createTradeRequest,
  cancelTradeRequest,
  getTradeRequestsByApplicantAndCard
};
