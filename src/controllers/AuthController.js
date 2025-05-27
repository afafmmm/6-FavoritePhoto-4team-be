import express from 'express';
import authService from '../services/AuthService.js';
import passport from '../config/passport.js';
import { asyncHandler } from '../utils/async-handler.js';
import jwt from 'jsonwebtoken';

const authController = express.Router();

// POST /auth/signup - 회원가입
authController.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { nickname, email, password, passwordConfirmation } = req.body;

    if (!nickname || !email || !password || !passwordConfirmation) {
      const error = new Error('닉네임, 이메일, 비밀번호, 비밀번호 확인은 필수입니다.');
      error.code = 422;
      throw error;
    }
    const result = await authService.signUpUser({
      nickname,
      email,
      password,
      passwordConfirmation
    });

    res.status(201).json(result);
  })
);

// POST /auth/login - 로그인
authController.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error('이메일과 비밀번호를 모두 입력해주세요.');
      error.code = 422;
      throw error;
    }
    const { accessToken, refreshToken, user } = await authService.logInUser(email, password);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'None',
      secure: true
    });

    res.json({ accessToken, user });
  })
);

// POST /auth/logout - 로그아웃
authController.post(
  '/logout',
  asyncHandler(async (req, res) => {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      path: '/',
      sameSite: 'None',
      secure: true
    });
    res.status(200).json({ message: '성공적으로 로그아웃되었습니다.' });
  })
);

// POST /auth/refresh-token - 액세스 토큰 재발급
authController.post(
  '/refresh-token',

  passport.authenticate('refresh-token', {
    session: false,
    failWithError: true
  }),
  asyncHandler(async (req, res) => {
    const user = req.user;

    const newAccessToken = authService.generateNewAccessToken(user);
    res.json({ accessToken: newAccessToken });
  })
);

// 구글 OAuth2 로그인
// 1. 구글 로그인 페이지로 리다이렉트
authController.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. 구글 콜백 처리
authController.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/fail' }),
  (req, res) => {
    // JWT 발급 및 프론트로 전달
    const user = req.user;
    const payload = {
      userId: user.id,
      email: user.email,
      nickname: user.nickname
    };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'None',
      secure: true
    });
    // 프론트엔드로 토큰과 유저 정보 전달 (리다이렉트 또는 JSON)
    res.redirect(`http://localhost:3000/`);
  }
);

// 구글 로그인 실패시
authController.get('/google/fail', (req, res) => {
  res.status(401).json({ message: '구글 로그인에 실패했습니다.' });
});

export default authController;
