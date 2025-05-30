import * as purchaseRepository from '../repositories/Purchaserepository.js';
import prisma from '../config/prisma.js';
import * as PointService from './PointService.js';
import Notification from '../services/NotificationsService.js';

export async function purchaseCards(saleId, buyerId, purchaseQuantity) {
  return await prisma.$transaction(async (tx) => {
    const sale = await purchaseRepository.findPurchaseSaleWithUserCards(saleId);

    if (!sale) throw new Error('존재하지 않는 판매입니다.');
    if (sale.status !== 'AVAILABLE') throw new Error('판매 중이 아닙니다.');
    if (sale.saleQuantity < purchaseQuantity) throw new Error('판매 수량이 부족합니다.');

    const availableUserCards = sale.saleUserCards
      .map((suc) => suc.userCard)
      .filter((uc) => uc.status === 'AVAILABLE' && uc.ownerId === sale.sellerId);

    if (availableUserCards.length < purchaseQuantity) throw new Error('구매 가능한 카드 수량이 부족합니다.');

    const userCardsToPurchase = availableUserCards.slice(0, purchaseQuantity);

    // 구매 금액 계산
    const totalPrice = sale.price * purchaseQuantity;

    // 구매자 포인트 확인 및 차감
    const buyerPoint = await tx.userPoint.findFirst({
      where: { userId: buyerId }
    });

    if (!buyerPoint || buyerPoint.points < totalPrice) {
      throw new Error('포인트가 부족합니다.');
    }

    // await tx.userPoint.update({
    //   where: { id: buyerPoint.id },
    //   data: { points: { decrement: totalPrice } }
    // });

    await PointService.updatePoint(buyerId, -totalPrice, null);

    // 판매자 포인트 지급 - upsert 대신 findFirst + update/create
    const existingSellerPoint = await tx.userPoint.findFirst({
      where: { userId: sale.sellerId }
    });

    if (existingSellerPoint) {
      // await tx.userPoint.update({
      //   where: { id: existingSellerPoint.id },
      //   data: { points: { increment: totalPrice } }
      // });
      await PointService.updatePoint(sale.sellerId, totalPrice, null);
    } else {
      await tx.userPoint.create({
        data: {
          userId: sale.sellerId,
          points: totalPrice,
          lastClaimed: null,
          todayClaimCount: 0
        }
      });
    }

    // UserCard 소유권 이전
    const promises = userCardsToPurchase.map((uc) =>
      purchaseRepository.updatePurchasedUserCardOwner(uc.id, buyerId, tx)
    );
    await Promise.all(promises);

    // 판매 수량 갱신
    const newSaleQuantity = sale.saleQuantity - purchaseQuantity;
    await purchaseRepository.updatePurchaseSaleQuantityAndStatus(
      saleId,
      newSaleQuantity,
      newSaleQuantity === 0 ? 'SOLDOUT' : 'AVAILABLE',
      tx
    );

    // 구매 카드 정보로 알림 메시지 생성
    const firstUserCard = userCardsToPurchase[0];
    // 포토카드 정보 조회
    const photoCard = await tx.photoCard.findUnique({
      where: { id: firstUserCard.photoCardId },
      include: { cardGrade: true }
    });
    const cardName = photoCard?.name || '카드 이름 불러오기 실패';
    const cardGrade = photoCard?.cardGrade?.name || '등급 불러오기 실패';
    const message = `[${cardGrade} | ${cardName}] ${purchaseQuantity}장을 성공적으로 구매했습니다.`;
    await Notification.createNotification({
      userId: buyerId,
      message
    });

    return {
      message: '구매 완료',
      saleId,
      purchasedQuantity: purchaseQuantity,
      purchasedUserCardIds: userCardsToPurchase.map((uc) => uc.id)
    };
  });
}
