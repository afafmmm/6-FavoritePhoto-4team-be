import authRepository from '../repositories/AuthRepository.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import PointRepository from '../repositories/PointRepository.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables. Please set it.');
}

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

async function signUpUser({ nickname, email, password, passwordConfirmation }) {
  if (password !== passwordConfirmation) {
    const error = new Error('비밀번호가 일치하지 않습니다.');
    error.code = 422;
    throw error;
  }
  const existingUserByEmail = await authRepository.findByEmail(email);
  if (existingUserByEmail) {
    const error = new Error('이미 사용중인 이메일입니다.');
    error.code = 409;
    throw error;
  }

  const existingUserByNickname = await authRepository.findByNickname(nickname);
  if (existingUserByNickname) {
    const error = new Error('이미 사용중인 닉네임입니다.');
    error.code = 409;
    throw error;
  }

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await authRepository.create({
    nickname,
    email,
    password: hashedPassword
  });

  // 회원가입 시 포인트 테이블 생성 및 기본 포인트 10 지급
  await PointRepository.createUserPoint(newUser.id, 10, null, 0);

  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

async function logInUser(email, password) {
  const user = await authRepository.findByEmail(email);
  if (!user) {
    const error = new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
    error.code = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
    error.code = 401;
    throw error;
  }

  const payload = {
    userId: user.id,
    email: user.email,
    nickname: user.nickname
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  });
  const refreshToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  });

  const { password: _, ...userWithoutPassword } = user;

  return { accessToken, refreshToken, user: userWithoutPassword };
}

async function getUserById(id) {
  const user = await authRepository.findById(id);

  if (user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
}

function generateNewAccessToken(user) {
  if (!user || !user.id) {
    const error = new Error('새로운 액세스 토큰을 생성하기 위한 사용자 정보가 유효하지 않습니다.');
    error.code = 400;
    throw error;
  }

  const payload = {
    userId: user.id,
    email: user.email,
    nickname: user.nickname
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  });
}

export default {
  signUpUser,
  logInUser,
  getUserById,
  generateNewAccessToken
};
