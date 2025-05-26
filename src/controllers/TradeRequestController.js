import express from 'express';
import passport from 'passport';
import tradeRequestService from '../services/TradeRequestService.js';

const tradeRequestController = express.Router();

//교환 요청하기
tradeRequestController.post(
  '/cards/:listedCardId/exchange',
  passport.authenticate('access-token', { session: false }),
  async (req, res, next) => {
    try {
      const { listedCardId } = req.params;
      const applicantId = req.user.id;
      const { offeredUserCardIds, description } = req.body;

      const result = await tradeRequestService.createTradeRequest({
        listedCardId: Number(listedCardId),
        applicantId,
        offeredUserCardIds,
        description
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

//취소하기
tradeRequestController.patch(
  '/trade/:id/cancel',
  passport.authenticate('access-token', { session: false }),
  async (req, res, next) => {
    try {
      const tradeRequestId = Number(req.params.id);
      const userId = req.user.id;
      

      const result = await tradeRequestService.cancelTradeRequest(tradeRequestId, userId);

      console.log('취소 결과:', result);

      res.status(200).json(result);
    } catch (err) {
      console.error('에러 발생:', err);
      next(err);
    }
  }
);

export default tradeRequestController;
