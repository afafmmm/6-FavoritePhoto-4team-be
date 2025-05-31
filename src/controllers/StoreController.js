import express from 'express';
import passport from 'passport';
import storeService from '../services/StoreService.js';

const storeController = express.Router();

storeController.get('/', async (req, res, next) => {
  try {
    console.log('🔥SERVER');
    const { grade, genre, sale, orderBy, keyword, withCounts } = req.query;
    const result = await storeService.getFilteredSalesWithCounts({
      grade,
      genre,
      sale,
      orderBy,
      keyword,
      withCounts: withCounts === 'true'
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

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
