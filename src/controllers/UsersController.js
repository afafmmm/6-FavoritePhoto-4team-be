import express from 'express';
import usersService from '../services/UsersService.js';
import passport from '../config/passport.js';
import { validatePostCard } from '../utils/validators.js';

const usersController = express.Router();

// ✅ 등급 + 장르 불러오기
usersController.get('/card-meta', async (req, res, next) => {
  try {
    const metaData = await usersService.getCardMetaData();
    return res.json(metaData);
  } catch (err) {
    next(err);
  }
});

// ✅ 월별 생성 횟수
usersController.get(
  '/monthly-post-count',
  passport.authenticate('access-token', { session: false, failWithError: true }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const count = await usersService.getCardCreationCount(userId);
      res.json({ count });
    } catch (err) {
      next(err);
    }
  }
);

// ✅ 카드 개수 (등급별)
usersController.get(
  '/cards-count',
  passport.authenticate('access-token', { session: false, failWithError: true }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const data = await usersService.getCardsCount(userId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// ✅ 🔥 포토카드 생성 (Cloudinary URL 방식)
usersController.post(
  '/post',
  passport.authenticate('access-token', { session: false, failWithError: true }),
  async (req, res, next) => {
    console.log("서버 요청이 들어옴")
    try {
      const creatorId = req.user.id;
      const { name, grade, genre, description, volumn, price, image } = req.body;

      if (!creatorId) throw new Error('미로그인 상태입니다.');

      const count = await usersService.getCardCreationCount(creatorId);

      if (count >= 3) throw new Error('한 달 생성 횟수를 초과했습니다.');

      const query = {
        name,
        grade, 
        genre, 
        description,
        volumn,
        price,
        image,
        creatorId
      };

      const errors = validatePostCard(query);
      if (Object.keys(errors).length > 0) {
        const error = new Error('유효성 검사 실패');
        error.details = errors;
        throw error;
      }

      const result = await usersService.create(query);
      res.status(201).json(result);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
);

// ✅ 내 갤러리 조회
usersController.get(
  '/gallery',
  passport.authenticate('access-token', { session: false, failWithError: true }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const result = await usersService.getMyGallery(userId, req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ✅ 내 판매 카드 조회
usersController.get(
  '/cards-on-sale',
  passport.authenticate('access-token', { session: false, failWithError: true }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const result = await usersService.getMySales(userId, req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ✅ 사용자 정보 조회
usersController.get(
  '/',
  passport.authenticate('access-token', { session: false, failWithError: true }),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userInfo = await usersService.getUser(userId);
      res.json(userInfo);
    } catch (err) {
      next(err);
    }
  }
);

export default usersController;
