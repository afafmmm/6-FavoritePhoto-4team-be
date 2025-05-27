import prisma from "../config/prisma.js";
import tradeRequestRepository from "../repositories/TradeRequestRepository.js";

async function createTradeRequest({ listedCardId, applicantId, offeredUserCardIds, description }) {
  // 대상 카드 조회 (포토카드 + 소유자)
  const targetSale = await tradeRequestRepository.findSaleByPhotoCardId(listedCardId);
  if (!targetSale) {
    throw new Error("교환 대상 카드가 존재하지 않습니다.");
  }

  // 신청자가 제공하는 카드 소유 확인
  const ownedUserCards = await tradeRequestRepository.findUserCardsByIds(applicantId, offeredUserCardIds);
  if (ownedUserCards.length !== offeredUserCardIds.length) {
    throw new Error("신청자가 제공하는 카드 중 소유하지 않은 카드가 있습니다.");
  }

  const offeredPhotoCardId = ownedUserCards[0].photoCardId;

  // 트랜잭션으로 묶어서 처리
  const tradeRequest = await prisma.$transaction(async (tx) => {

    const newTradeRequest = await tx.tradeRequest.create({
      data: {
        photoCardId: listedCardId,
        ownerId: targetSale.sellerId,
        applicantId,
        offeredPhotoCardId,
        description,
        tradeStatus: 'PENDING'
      }
    });
    await Promise.all(
      offeredUserCardIds.map(userCardId =>
        tx.tradeRequestUserCard.create({
          data: {
            tradeRequestId: newTradeRequest.id,
            userCardId
          }
        })
      )
    );

    //UserCard 상태 업데이트
    await tx.userCard.updateMany({
      where: { id: { in: offeredUserCardIds } },
      data: { status: "TRADED" }
    });

    //Sale 상태 업데이트
    await tx.sale.updateMany({
      where: { photoCardId: listedCardId, status: 'AVAILABLE' },
      data: { status: 'PENDING' }
    });

    return newTradeRequest;
  });

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

export default {
  createTradeRequest,
  cancelTradeRequest
};