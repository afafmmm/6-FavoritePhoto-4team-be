import prisma from "../config/prisma.js";

async function createSale({
  sellerId,
  photoCardId,
  userCardIds,
  price,
  saleQuantity,
  desiredGradeId,
  desiredGenreId,
  desiredDescription,
}) {
  return await prisma.$transaction(async (tx) => {
    // 카드 소유 및 상태 확인
    const validCards = await tx.userCard.findMany({
      where: {
        id: { in: userCardIds },
        ownerId: sellerId,
        status: "ACTIVE",
        photoCardId,
      },
    });

    if (validCards.length !== userCardIds.length) {
      throw new Error(
        "유효하지 않거나 이미 거래 중인 카드가 포함되어 있습니다."
      );
    }

    const sale = await tx.sale.create({
      data: {
        sellerId,
        photoCardId,
        price,
        saleQuantity,
        cardGradeId: desiredGradeId,
        cardGenreId: desiredGenreId,
        desiredDescription,
        status: "AVAILABLE",
      },
    });

    const saleUserCards = await Promise.all(
      userCardIds.map((userCardId) =>
        tx.saleUserCard.create({
          data: {
            saleId: sale.id,
            userCardId,
          },
        })
      )
    );

    // 상태 변경: 해당 카드들을 AVAILABLE로
    await tx.userCard.updateMany({
      where: { id: { in: userCardIds } },
      data: { status: "AVAILABLE" },
    });

    // PhotoCard 수량 감소
    await tx.photoCard.update({
      where: { id: photoCardId },
      data: {
        totalQuantity: {
          decrement: saleQuantity,
        },
      },
    });

    return {
      sale,
      saleUserCards,
    };
  });
}

export default { createSale };
