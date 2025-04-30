import express from "express";
import auth from "../middleware/auth.js";

const route1 = express.Router();

route1.use(auth);

route1
  .route("/")
  .get((req, res) => {
    res.json({ message: "Product 목록 보기" });
  })
  .post((req, res) => {
    res.json({ message: "Product 추가하기" });
  });

export default route1;
