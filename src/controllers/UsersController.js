import express from "express";
import usersService from "../services/UsersService.js";
import upload from "../middlewares/upload.js";

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
usersController.post("/post", upload.single("card"), async (req, res, next) => {
  try {
    const { name, grade, genre, description, volumn, price } = req.body;

    const creatorId = 1;
    // const creatorId = req.user.id; // 나중에 id 이름 확인할 것
    const imageFile = req.file;

    const result = await usersService.create({
      name,
      grade,
      genre,
      description,
      volumn,
      price,
      imageFile,
      creatorId,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

export default usersController;
