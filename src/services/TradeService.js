import prisma from '../config/prisma.js';
import TradeRepository from '../repositories/TradeRepository.js';

async function getTradeRequestsForSale(saleId) {
  return await TradeRepository.findTradeRequestsBySaleId(saleId);
}

async function acceptTradeRequest(tradeRequestId) {
  return await TradeRepository.acceptTradeRequest(tradeRequestId);
}

async function rejectTradeRequest(tradeRequestId, ownerId) {
  const tradeRequest = await TradeRepository.findTradeRequestById(tradeRequestId);

  if (!tradeRequest) throw new Error('해당 교환 요청이 존재하지 않습니다.');
  if (tradeRequest.ownerId !== ownerId) throw new Error('권한이 없습니다.');
  if (tradeRequest.tradeStatus !== 'PENDING') throw new Error('이미 처리된 교환 요청입니다.');

  return await prisma.$transaction(async (tx) => {
    // 상태 REJECTED로 변경
    await tx.tradeRequest.update({
      where: { id: tradeRequestId },
      data: { tradeStatus: 'REJECTED' }
    });

    // 신청자의 카드 상태를 ACTIVE로 복원
    await tx.userCard.updateMany({
      where: {
        tradeRequestUserCards: {
          some: { tradeRequestId }
        }
      },
      data: { status: 'ACTIVE' }
    });

    return { message: '교환 요청이 거절되었습니다.' };
  });
}

export default {
  getTradeRequestsForSale,
  acceptTradeRequest,
  rejectTradeRequest
};
