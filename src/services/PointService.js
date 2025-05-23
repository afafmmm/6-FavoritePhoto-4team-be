import prisma from '../config/prisma.js';

// 하루 최대 3번, 1시간에 1번 랜덤 상자 뽑기 (포인트 획득)
export async function claimRandomBox(userId) {
  const userPoint = await prisma.userPoint.findFirst({ where: { userId } });
  const now = new Date();
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD

  let resetTodayClaimCount = false;
  if (userPoint && userPoint.lastClaimed) {
    const lastClaimedDate = userPoint.lastClaimed.toISOString().slice(0, 10);
    // 날짜가 바뀌면 todayClaimCount 초기화
    if (lastClaimedDate !== today) {
      resetTodayClaimCount = true;
    } else {
      // 1시간 제한 체크
      const diff = (now - userPoint.lastClaimed) / (1000 * 60 * 60);
      if (diff < 1) {
        throw new Error('1시간에 1번만 뽑을 수 있습니다.');
      }
      // 하루 3번 제한 체크
      if (userPoint.todayClaimCount >= 3) {
        throw new Error('하루 최대 3번만 뽑을 수 있습니다.');
      }
    }
  }
  // 랜덤 포인트 (예: 10~100)
  const randomPoints = Math.floor(Math.random() * 91) + 10;
  let updated;
  if (userPoint) {
    updated = await prisma.userPoint.update({
      where: { id: userPoint.id },
      data: {
        points: { increment: randomPoints },
        lastClaimed: now,
        todayClaimCount: resetTodayClaimCount ? 1 : userPoint.todayClaimCount + 1
      }
    });
  } else {
    updated = await prisma.userPoint.create({
      data: {
        userId,
        points: randomPoints,
        lastClaimed: now,
        todayClaimCount: 1
      }
    });
  }
  return { points: randomPoints, totalPoints: updated.points };
}

// 내 포인트 조회
export async function getMyPoint(userId) {
  const userPoint = await prisma.userPoint.findFirst({ where: { userId } });
  if (!userPoint) {
    return { points: 0, lastClaimed: null, todayClaimCount: 0 };
  }
  return {
    points: userPoint.points,
    lastClaimed: userPoint.lastClaimed,
    todayClaimCount: userPoint.todayClaimCount
  };
}
