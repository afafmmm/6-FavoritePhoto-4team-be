import * as tradeRequestService from '../services/TradeRequestService.js'

export const createTradeRequest = async (req, res, next) => {
  try {
    const { photoCardId, offeredPhotoCardId, description } = req.body
    const userId = req.user.id  

    const newTradeRequest = await tradeRequestService.createTradeRequest({
      photoCardId,
      offeredPhotoCardId,
      ownerId: null,  
      applicantId: userId,
      description,
    })

    res.status(201).json(newTradeRequest)
  } catch (err) {
    next(err)
  }
}
