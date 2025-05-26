import express from 'express';
import passport from 'passport';
import SalesService from '../services/SalesService.js';

const salesController = express.Router();

// 판매 등록
salesController.post('/cards', passport.authenticate('access-token', { session: false }), async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const saleData = req.body;

    const result = await SalesService.createSale({ sellerId, ...saleData });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// 판매 취소
salesController.delete(
  '/cards/:saleId',
  passport.authenticate('access-token', { session: false }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const saleId = parseInt(req.params.saleId);
      await SalesService.cancelSale(userId, saleId);
      res.status(200).json({ message: '판매가 취소되었습니다.' });
    } catch (err) {
      next(err);
    }
  }
);

// 판매 수정
salesController.patch(
  '/cards/:saleId',
  passport.authenticate('access-token', { session: false }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const saleId = parseInt(req.params.saleId);
      const updateData = req.body;
      const updated = await SalesService.updateSale(userId, saleId, updateData);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export default salesController;
