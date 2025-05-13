import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import cors from "cors";

import errorHandler from "./middlewares/ErrorHandler.js";
import usersController from "./controllers/UsersController.js";
import authController from "./controllers/AuthController.js";
import storeController from "./controllers/StoreController.js";
import notificationsController from "./controllers/NotificationsController.js";
import pointsController from "./controllers/PointsController.js";
const app = express();
app.use(
  cors({
    origin: "http://localhost:3001", // 프론트엔드 주소
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/auth", authController);
app.use("/api/users", usersController);
app.use("/api/store", storeController);
app.use("/api/notifications", notificationsController);
app.use("/api/points", pointsController);

app.use(errorHandler);

// 서버 실행
const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
