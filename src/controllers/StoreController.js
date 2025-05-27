import express from 'express';
import passport from 'passport'; 
import storeService from '../services/StoreService.js';

const storeController = express.Router();

storeController.get('/', async (req, res, next) => {
  try {
    const { grade, genre, sale, orderBy } = req.query;

    // CSV 문자열을 배열로 변환하는 함수
    const parseCSV = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      return value.split(',').map(v => v.trim());
    };

    const gradeArr = parseCSV(grade);
    const genreArr = parseCSV(genre);
    const saleArr = parseCSV(sale);

    const result = await storeService.getFilteredSalesWithCounts({
      grade: gradeArr,
      genre: genreArr,
      sale: saleArr,
      orderBy
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
