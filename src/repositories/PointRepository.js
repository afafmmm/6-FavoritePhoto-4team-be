import prisma from '../config/prisma.js';

const PointRepository = {
  //포인트 조회
  getUserPoint: async (userId) => {
    return prisma.userPoint.findFirst({ where: { userId } });
  },
  //포인트 업데이트
  updateUserPoint: async (userId, points, lastClaimed, todayClaimCount) => {
    return prisma.userPoint.update({
      where: { userId },
      data: { points, lastClaimed, todayClaimCount }
    });
  },
  //포인트 생성
  createUserPoint: async (userId, points, lastClaimed, todayClaimCount) => {
    return prisma.userPoint.create({
      data: { userId, points, lastClaimed, todayClaimCount }
    });
  },
  //포인트 삭제
  deleteUserPoint: async (userId) => {
    return prisma.userPoint.deleteMany({ where: { userId } });
  }
};

export default PointRepository;
