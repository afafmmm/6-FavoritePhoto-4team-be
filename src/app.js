import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import cors from 'cors';
import errorHandler from './middlewares/ErrorHandler.js';
import usersController from './controllers/UsersController.js';
import authController from './controllers/AuthController.js';
import salesController from './controllers/SalesController.js';
import storeController from './controllers/StoreController.js';
import pointsController from './controllers/PointsController.js';
import notificationsController from './controllers/NotificationsController.js';
import tradeRequestController from './controllers/TradeRequestController.js';
import { Server } from 'socket.io';
import http from 'http';
import tradeRequestController from './controllers/TradeRequestController.js';

const app = express();
app.use(
  cors({
    origin: [
      'https://6-favorite-photo-4team-fe.vercel.app', 
      'http://localhost:3000' // 로컬 개발 환경 주소
    ],
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use('/uploads', express.static('src/uploads'));

app.use('/api/auth', authController);
app.use('/api/users', usersController);
app.use('/api/store', storeController);
app.use('/api/notifications', notificationsController);
app.use('/api/points', pointsController);
// app.use('/api/store', salesController);
app.use('/api/store', tradeRequestController);
app.use('/api/store', salesController); // 계속 사용하고 있으니 주석하지 말아주세요

app.use(errorHandler);

// 기존 app.listen 대신 http 서버 생성
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['https://6-favorite-photo-4team-fe.vercel.app', 'http://localhost:3000'],
    credentials: true
  }
});

// 소켓 연결 이벤트
io.on('connection', (socket) => {
  // 유저 식별(예: 토큰/유저ID 등)
  socket.on('join', (userId) => {
    socket.join(userId); // 유저별 방 입장
  });
});

app.set('io', io); // app에서 io 객체 사용 가능하게 등록

// 서버 실행
const port = process.env.PORT ?? 3002;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
