import express from 'express';
import storeService from '../services/StoreService.js';

const storeController = express.Router();

// 카드 목록 조회
storeController.get('/', async (req, res, next) => {
  try {
    const cards = await storeService.getAllCards();
    res.json(cards);
  } catch (err) {
    next(err);
  }
});

// 카드 상세 조회
storeController.get(
  '/cards/:id',
  passport.authenticate('access-token', {
    session: false,
    failWithError: true
  }),
  async (req, res, next) => {
    try {
      const cardId = parseInt(req.params.id, 10);
      const card = await storeService.getCardById(cardId);
      if (!card) {
        return res.status(404).json({ message: '카드를 찾을 수 없습니다.' });
      }
      res.json(card);
    } catch (err) {
      next(err);
    }
  }
);

export default storeController;
