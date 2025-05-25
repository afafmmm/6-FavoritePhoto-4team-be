import * as tradeRequestRepository from '../repositories/tradeRequest.repository.js'
import prisma from '../utils/prismaClient.js'

export const createTradeRequest = async ({
  photoCardId,
  offeredPhotoCardId,
  ownerId,
  applicantId,
  description
}) => {
  // photoCardId의 실제 소유자를 찾아야 함
  const targetCard = await prisma.userCard.findFirst({
    where: {
      photoCardId,
      status: 'ACTIVE',
    },
    include: {
      owner: true,
    }
  })

  if (!targetCard || !targetCard.owner) {
    throw new Error('해당 포토카드의 소유자를 찾을 수 없습니다.')
  }

  return await tradeRequestRepository.create({
    photoCardId,
    offeredPhotoCardId,
    ownerId: targetCard.owner.id,
    applicantId,
    description,
  })
}
