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

  // 교환 요청 생성
  const tradeRequest = await tradeRequestRepository.createTradeRequest({
    photoCardId: listedCardId,
    ownerId: targetSale.sellerId,
    applicantId,
    offeredPhotoCardId,  
    description,
  });

  // 교환 요청 카드 연결 
  await tradeRequestRepository.createTradeRequestUserCards(tradeRequest.id, offeredUserCardIds);

  return tradeRequest;
}

export default {
  createTradeRequest,
};
