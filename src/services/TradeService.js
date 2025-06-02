import prisma from '../config/prisma.js';
import TradeRepository from '../repositories/TradeRepository.js';
import Notification from './NotificationsService.js';

async function getTradeRequestsForSale(saleId) {
  return await TradeRepository.findTradeRequestsBySaleId(saleId);
}

async function acceptTradeRequest(tradeRequestId) {
  return await TradeRepository.acceptTradeRequest(tradeRequestId);
}

async function rejectTradeRequest(tradeRequestId, ownerId, io = null) {
  const tradeRequest = await TradeRepository.findTradeRequestById(tradeRequestId);

  if (!tradeRequest) throw new Error('해당 교환 요청이 존재하지 않습니다.');
  if (tradeRequest.ownerId !== ownerId) throw new Error('권한이 없습니다.');
  if (tradeRequest.tradeStatus !== 'PENDING') throw new Error('이미 처리된 교환 요청입니다.');

  const result = await prisma.$transaction(async (tx) => {
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

  // 알림 생성 (거절된 신청자에게)
  try {
    // 판매자 닉네임 조회
    const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { nickname: true } });
    // 포토카드 이름, 장르 조회
    const photoCard = await prisma.photoCard.findUnique({
      where: { id: tradeRequest.photoCardId },
      select: { name: true, genreId: true }
    });
    let genreName = '';
    if (photoCard?.genreId) {
      const genre = await prisma.cardGenre.findUnique({ where: { id: photoCard.genreId }, select: { name: true } });
      genreName = genre?.name ? `[${genre.name}] ` : '';
    }
    const applicantId = tradeRequest.applicantId;
    const ownerName = owner?.nickname || '판매자';
    const cardName = photoCard?.name || '포토카드';
    const message = `${ownerName}님과의 [${genreName} | ${cardName}]의 포토카드 교환이 불발되었습니다.`;
    await Notification.createNotification({ userId: applicantId, message }, io);
  } catch (e) {
    console.log('거절 알림 생성 중 오류:', e.message);
  }

  return result;
}

export default {
  getTradeRequestsForSale,
  acceptTradeRequest,
  rejectTradeRequest
};
