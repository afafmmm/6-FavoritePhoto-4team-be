import prisma from '../config/prisma.js';

async function createSale({
  sellerId,
  photoCardId,
  userCardIds,
  salePrice,
  saleQuantity,
  desiredGradeId,
  desiredGenreId,
  desiredDescription
}) {
  return await prisma.$transaction(async (tx) => {
    // 카드 소유 및 상태 확인
    const validCards = await tx.userCard.findMany({
      where: {
        id: { in: userCardIds },
        ownerId: sellerId,
        status: 'ACTIVE',
        photoCardId
      }
    });

    if (validCards.length !== userCardIds.length) {
      throw new Error('유효하지 않거나 이미 거래 중인 카드가 포함되어 있습니다.');
    }

    const sale = await tx.sale.create({
      data: {
        sellerId,
        photoCardId,
        price: salePrice,
        saleQuantity,
        cardGradeId: desiredGradeId,
        cardGenreId: desiredGenreId,
        desiredDescription,
        status: 'AVAILABLE'
      }
    });

    const saleUserCards = await Promise.all(
      userCardIds.map((userCardId) =>
        tx.saleUserCard.create({
          data: {
            saleId: sale.id,
            userCardId
          }
        })
      )
    );

    // 상태 변경: 해당 카드들을 AVAILABLE로
    await tx.userCard.updateMany({
      where: { id: { in: userCardIds } },
      data: { status: 'AVAILABLE' }
    });

    // PhotoCard 수량 감소
    await tx.photoCard.update({
      where: { id: photoCardId },
      data: {
        totalQuantity: {
          decrement: saleQuantity
        }
      }
    });

    return {
      sale,
      saleUserCards
    };
  });
}

async function cancelSale(userId, saleId) {
  return await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: {
        saleUserCards: true,
        photoCard: true
      }
    });

    if (!sale || sale.sellerId !== userId) {
      throw new Error('판매 정보가 없거나 권한이 없습니다.');
    }

    const userCardIds = sale.saleUserCards.map((suc) => suc.userCardId);

    // 상태 복원 및 판매가격 초기화
    await tx.userCard.updateMany({
      where: { id: { in: userCardIds } },
      data: {
        status: 'ACTIVE',
        price: sale.photoCard.initialPrice
      }
    });

    // 총수량 복원
    await tx.photoCard.update({
      where: { id: sale.photoCardId },
      data: {
        totalQuantity: {
          increment: sale.saleQuantity
        }
      }
    });

    // SaleUserCard 삭제 → Sale 삭제
    await tx.saleUserCard.deleteMany({
      where: { saleId }
    });

    await tx.sale.delete({
      where: { id: saleId }
    });
  });
}

async function updateSale(userId, saleId, updateData) {
  const allowedFields = ['salePrice', 'saleQuantity', 'desiredGradeId', 'desiredGenreId', 'desiredDescription'];
  const updatePayload = {};

  for (const key of allowedFields) {
    if (updateData[key] !== undefined) {
      switch (key) {
        case 'salePrice':
          updatePayload['price'] = updateData[key];
          break;
        case 'desiredGradeId':
          updatePayload['cardGradeId'] = updateData[key];
          break;
        case 'desiredGenreId':
          updatePayload['cardGenreId'] = updateData[key];
          break;
        default:
          updatePayload[key] = updateData[key];
      }
    }
  }

  return await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: {
        photoCard: true,
        saleUserCards: true
      }
    });

    if (!sale || sale.sellerId !== userId) {
      throw new Error('판매 정보가 없거나 권한이 없습니다.');
    }

    if (updatePayload.saleQuantity !== undefined) {
      const quantityDiff = updatePayload.saleQuantity - sale.saleQuantity;

      if (quantityDiff > 0) {
        const extraCards = await tx.userCard.findMany({
          where: {
            ownerId: userId,
            photoCardId: sale.photoCardId,
            status: 'ACTIVE'
          },
          take: quantityDiff
        });

        if (extraCards.length < quantityDiff) {
          throw new Error('추가 판매 등록할 카드가 부족합니다.');
        }

        await Promise.all(
          extraCards.map((card) =>
            tx.saleUserCard.create({
              data: {
                saleId,
                userCardId: card.id
              }
            })
          )
        );

        await tx.userCard.updateMany({
          where: { id: { in: extraCards.map((c) => c.id) } },
          data: { status: 'AVAILABLE' }
        });
      } else if (quantityDiff < 0) {
        const removeCount = -quantityDiff;
        const removableCards = sale.saleUserCards.slice(-removeCount);

        await tx.saleUserCard.deleteMany({
          where: { id: { in: removableCards.map((r) => r.id) } }
        });

        await tx.userCard.updateMany({
          where: { id: { in: removableCards.map((r) => r.userCardId) } },
          data: { status: 'ACTIVE' }
        });
      }

      await tx.photoCard.update({
        where: { id: sale.photoCardId },
        data: {
          totalQuantity: {
            decrement: -quantityDiff
          }
        }
      });
    }

    const updated = await tx.sale.update({
      where: {
        id: saleId,
        sellerId: userId
      },
      data: updatePayload,
      include: {
        cardGrade: true,
        cardGenre: true
      }
    });

    return updated;
  });
}

export default { createSale, cancelSale, updateSale };
