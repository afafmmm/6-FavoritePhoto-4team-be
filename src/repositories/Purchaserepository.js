import prisma from '../config/prisma.js'

// 구매 관련 - 판매 + 판매에 연결된 UserCard 조회
export async function findPurchaseSaleWithUserCards(saleId) {
  return prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      saleUserCards: {
        include: {
          userCard: true,
        },
      },
    },
  })
}

// UserCard 소유자 변경 (구매자 변경)
export async function updatePurchasedUserCardOwner(userCardId, newOwnerId, tx = prisma) {
  return tx.userCard.update({
    where: { id: userCardId },
    data: { ownerId: newOwnerId },
  })
}

// 판매 수량 및 상태 업데이트 (구매 후 재고 및 상태 업데이트)
export async function updatePurchaseSaleQuantityAndStatus(saleId, remainingQuantity, status, tx = prisma) {
  return tx.sale.update({
    where: { id: saleId },
    data: {
      saleQuantity: remainingQuantity,
      status,
    },
  })
}
