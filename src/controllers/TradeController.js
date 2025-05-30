import express from 'express';
import passport from 'passport';
import TradeService from '../services/TradeService.js';

const tradeController = express.Router();

// 특정 판매카드에 대한 교환 요청 목록 조회
tradeController.get(
  '/cards/:saleId/trade-requests',
  passport.authenticate('access-token', { session: false }),
  async (req, res, next) => {
    try {
      const saleId = Number(req.params.saleId);
      const tradeRequests = await TradeService.getTradeRequestsForSale(saleId);
      res.status(200).json(tradeRequests);
    } catch (err) {
      next(err);
    }
  }
);

// 교환 요청 승인
tradeController.patch(
  '/trade/:id/accept',
  passport.authenticate('access-token', { session: false }),
  async (req, res, next) => {
    try {
      const tradeRequestId = Number(req.params.id);
      const result = await TradeService.acceptTradeRequest(tradeRequestId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// 교환 요청 거절
tradeController.patch(
  '/trade/:id/reject',
  passport.authenticate('access-token', { session: false }),
  async (req, res, next) => {
    try {
      const tradeRequestId = Number(req.params.id);
      const userId = req.user.id;

      const result = await TradeService.rejectTradeRequest(tradeRequestId, userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default tradeController;
