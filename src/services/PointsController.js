import express from 'express';
import passport from '../config/passport.js';
import { claimRandomBox, getMyPoint, updatePoint } from '../services/PointService.js';

const pointsController = express.Router();

// 1시간에 1번 랜덤 상자 뽑기 (포인트 획득)
pointsController.post(
  '/random-box',
  passport.authenticate('access-token', { session: false, failWithError: true }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const io = req.app.get('io');
      const result = await claimRandomBox(userId, io);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// 내 포인트 조회
pointsController.get(
  '/me',
  passport.authenticate('access-token', { session: false, failWithError: true }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const result = await getMyPoint(userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// 포인트 증감 (amount: +면 증가, -면 차감)
pointsController.post(
  '/update',
  passport.authenticate('access-token', { session: false, failWithError: true }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { amount } = req.body;
      const io = req.app.get('io');
      const result = await updatePoint(userId, amount, io);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default pointsController;
