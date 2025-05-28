import * as purchaseRepository from '../repositories/Purchaserepository.js';
import prisma from '../config/prisma.js';

export async function purchaseCards(saleId, buyerId, purchaseQuantity) {
  return await prisma.$transaction(async (tx) => {
    const sale = await purchaseRepository.findPurchaseSaleWithUserCards(saleId);

    if (!sale) throw new Error('존재하지 않는 판매입니다.');
    if (sale.status !== 'AVAILABLE') throw new Error('판매 중이 아닙니다.');
    if (sale.saleQuantity < purchaseQuantity) throw new Error('판매 수량이 부족합니다.');

    const availableUserCards = sale.saleUserCards
      .map(suc => suc.userCard)
      .filter(uc => uc.status === 'AVAILABLE' && uc.ownerId === sale.sellerId);

    if (availableUserCards.length < purchaseQuantity)
      throw new Error('구매 가능한 카드 수량이 부족합니다.');

    const userCardsToPurchase = availableUserCards.slice(0, purchaseQuantity);

    // 구매 금액 계산
    const totalPrice = sale.price * purchaseQuantity;

    // 구매자 포인트 확인 및 차감
    const buyerPoint = await tx.userPoint.findFirst({
      where: { userId: buyerId },
    });

    if (!buyerPoint || buyerPoint.points < totalPrice) {
      throw new Error('포인트가 부족합니다.');
    }

    await tx.userPoint.update({
      where: { id: buyerPoint.id },
      data: { points: { decrement: totalPrice } },
    });

    // 판매자 포인트 지급 - upsert 대신 findFirst + update/create
    const existingSellerPoint = await tx.userPoint.findFirst({
      where: { userId: sale.sellerId },
    });

    if (existingSellerPoint) {
      await tx.userPoint.update({
        where: { id: existingSellerPoint.id },
        data: { points: { increment: totalPrice } },
      });
    } else {
      await tx.userPoint.create({
        data: {
          userId: sale.sellerId,
          points: totalPrice,
          lastClaimed: null,
          todayClaimCount: 0,
        },
      });
    }

    // UserCard 소유권 이전
    const promises = userCardsToPurchase.map(uc =>
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

    return {
      message: '구매 완료',
      saleId,
      purchasedQuantity: purchaseQuantity,
      purchasedUserCardIds: userCardsToPurchase.map(uc => uc.id),
    };
  });
}
