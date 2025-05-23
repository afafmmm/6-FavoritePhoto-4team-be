import express from "express";
import usersService from "../services/UsersService.js";
import upload from "../middlewares/upload.js";
import passport from "../config/passport.js";
import { validatePostCard } from "../utils/validators.js";

const usersController = express.Router();

// 등급 + 장르 소환
usersController.get("/card-meta", async (req, res, next) => {
  try {
    const metaData = await usersService.getCardMetaData();

    return res.json(metaData);
  } catch (err) {
    next(err);
  }
});

// POST
usersController.post(
  "/post",
  passport.authenticate("access-token", {
    session: false,
    failWithError: true,
  }),
  upload.single("image"),
  async (req, res, next) => {
    try {
      const creatorId = req.user.id;
      const image = req.file;
      const { name, grade, genre, description, volumn, price } = req.body;

      if (!creatorId) {
        const error = new Error("미로그인 상태입니다.");
        error.code = 401;
        throw error;
      }

      const query = {
        name,
        grade,
        genre,
        description,
        volumn,
        price,
        image,
        creatorId,
      }; // 내용 묶음 간단하게

      const errors = validatePostCard(query);
      if (Object.keys(errors).length > 0) {
        const error = new Error("유효성 검사 실패");
        error.code = 400;
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

// ----------- //

// GET: My Gallery
usersController.get(
  "/gallery",
  passport.authenticate("access-token", {
    session: false,
    failWithError: true,
  }),
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

// GET: 내 판매 카드
usersController.get(
  "/cards-on-sale",
  passport.authenticate("access-token", {
    session: false,
    failWithError: true,
  }),
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

// ----------- //

// GET: 사용자 1人
usersController.get(
  "/",
  passport.authenticate("access-token", {
    session: false,
    failWithError: true,
  }),
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
