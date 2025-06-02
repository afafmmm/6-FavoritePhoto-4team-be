import express from 'express';
import passport from 'passport';
import tradeRequestService from '../services/TradeRequestService.js';

const tradeRequestController = express.Router();

//교환 요청하기
tradeRequestController.post(
  '/cards/:saleId/exchange',
  passport.authenticate('access-token', { session: false }),
  async (req, res, next) => {
    try {
      const { saleId } = req.params;
      const applicantId = req.user.id;
      const { offeredUserCardIds, description } = req.body;
      const io = req.app.get('io');

      const result = await tradeRequestService.createTradeRequest(
        {
          saleId: Number(saleId),
          applicantId,
          offeredUserCardIds,
          description
        },
        io
      );

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

//취소하기
tradeRequestController.patch(
  '/cards/:listedCardId/exchange/:tradeRequestId/cancel',
  passport.authenticate('access-token', { session: false }),
  async (req, res, next) => {
    try {
      const tradeRequestId = Number(req.params.tradeRequestId);
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

// 신청자 본인의 교환 요청 목록 조회
tradeRequestController.get(
  '/cards/:saleId/exchange',
  passport.authenticate('access-token', { session: false }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const saleId = Number(req.params.saleId);

      const result = await tradeRequestService.getTradeRequestsByApplicantAndCard(userId, saleId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default tradeRequestController;
