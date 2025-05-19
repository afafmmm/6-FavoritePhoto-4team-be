import express from "express";
import UsersService from "../services/UsersService";

const usersController = express.Router();

// 등급 + 장르 소환
usersController.get("/card-meta", async (req, res, next) => {
  try {
    const metaData = await UsersService.getCardMetaData();

    return res.json(metaData);
  } catch (err) {
    next(err);
  }
});
