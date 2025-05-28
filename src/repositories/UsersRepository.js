import prisma from '../config/prisma.js';
import { startOfMonth, endOfMonth } from 'date-fns';
import countCardsByGrade from '../utils/countByGrade.js';

// 사용자 id 찾기
async function findById(id) {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      nickname: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

// 카드 장르 찾기
async function findGenre() {
  return await prisma.cardGenre.findMany({
    select: { id: true, name: true }
  });
}

// 카드 등급 찾기
async function findGrade() {
  return await prisma.cardGrade.findMany({
    select: { id: true, name: true }
  });
}

// 사용자별 카드 개수 세기
async function getCardsCount(userId) {
  const allCards = await prisma.userCard.findMany({
    where: {
      ownerId: userId
    },
    include: {
      photoCard: { select: { gradeId: true } }
    }
  }); // 일단 전체 카드 개수를 가져옴

  // 그리고 카드 상태를 active와 그 외로 나눔
  const active = allCards.filter((card) => card.status === 'ACTIVE');
  const inactive = allCards.filter((card) => card.status !== 'ACTIVE');

  // 그리고 등급별로 반환함
  return {
    active: countCardsByGrade(active),
    inactive: countCardsByGrade(inactive)
  };
}

// POST
async function create(query) {
  const { name, grade, genre, description, volumn, price, image, creatorId } = query;

  const imageUrl = `/uploads/${image.filename}`;
  const gradeRecord = await prisma.cardGrade.findUnique({
    where: { name: grade }
  });
  const genreRecord = await prisma.cardGenre.findUnique({
    where: { name: genre }
  });

  if (!gradeRecord || !genreRecord) {
    throw new Error('존재하지 않는 등급 또는 장르입니다.');
  }

  await prisma.$executeRawUnsafe(`
  SELECT setval(pg_get_serial_sequence('"PhotoCard"', 'id'), (
    SELECT MAX(id) FROM "PhotoCard"
  ) + 1);
  `);

  const photoCard = await prisma.photoCard.create({
    data: {
      name,
      imageUrl,
      gradeId: gradeRecord.id,
      genreId: genreRecord.id,
      description,
      totalQuantity: parseInt(volumn, 10),
      initialPrice: parseInt(price, 10),
      creatorId
    }
  });

  // 제작한 photoCard는 만든 이에게 귀속됨 -- 발행량만큼 생성되어야 함
  const userCards = Array.from({ length: parseInt(volumn, 10) }).map(() => ({
    photoCardId: photoCard.id,
    ownerId: creatorId,
    price: parseInt(price, 10)
  }));

  await prisma.userCard.createMany({
    data: userCards
  });

  return photoCard;
}

// 카드 생성 횟수 (월별)
async function getMonthlyCardCount(userId) {
  const now = new Date();

  return await prisma.photoCard.count({
    where: {
      creatorId: userId,
      createdAt: { gte: startOfMonth(now), lte: endOfMonth(now) } // 프리즈마 조건부 필터 문법
    }
  });
}

// ----------- //

// GET: 소유한 카드(거래·교환x)
async function findMyGallery(userId, { genreId, gradeId, search, offset = 0, limit = 10 }) {
  // query 문자열 조건
  const photoCardFilter = {
    // 카드 관련 조건: &&로 유무를 검사하고, 있으면 조건으로 넣음
    ...(genreId && { genreId: Number(genreId) }), // 1. 장르
    ...(gradeId && { gradeId: Number(gradeId) }), // 2. 등급
    ...(search && { name: { contains: search, mode: 'insensitive' } }) // 3. 검색어 = 카드 이름
  };

  // 카드 개수 추출
  const photoCardCount = await prisma.userCard.groupBy({
    by: ['photoCardId'],
    where: {
      ownerId: userId,
      status: 'ACTIVE',
      photoCard: photoCardFilter
    },
    _count: true
  });

  // 전체 카드 개수
  const totalItems = photoCardCount.length;

  // 페이지네이션 포함 쿼리 문자열 반환
  const items = await prisma.photoCard.findMany({
    select: {
      id: true,
      name: true,
      imageUrl: true,
      description: true,
      totalQuantity: true,
      gradeId: true,
      genreId: true,
      grade: { select: { name: true } },
      genre: { select: { name: true } },
      userCards: {
        where: { ownerId: userId, status: 'ACTIVE' },
        select: { id: true, price: true },
        take: 1
      },
      creator: { select: { id: true, nickname: true } }
    },

    where: {
      userCards: {
        some: { ownerId: userId, status: 'ACTIVE' }
      }
    },

    ...photoCardFilter,
    // 페이지, 정렬
    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: 'desc' }
  });

  return { totalItems, items };
}

// GET: 판매 중인 카드
async function findMySales(
  userId,
  {
    genreId,
    gradeId,
    search,
    saleType, // 판매 중, 교환 요청됨, undefined(품절된 것?)
    soldOut = 'false', // true(품절됨), false(그 외 = 판매or교환 중) -- FE에서 보냄
    offset = 0,
    limit = 10
  }
) {
  // 상태: ABAILABLE(판매 중), PENDING(교환 중), SOLDOUT(품절)
  const statusList = soldOut === 'true' ? ['SOLDOUT'] : ['AVAILABLE', 'PENDING'];

  // saleType 정의
  const allowedSaleTypes = ['판매', '교환'];
  if (saleType && !allowedSaleTypes.includes(saleType)) {
    const error = new Error("판매 유형은 '판매', '교환' 중 택1");
    error.code = 400;
    throw error;
  }

  // query string 조건 정리22
  const photoCardFilter = {
    ...(genreId && { genreId: Number(genreId) }),
    ...(gradeId && { gradeId: Number(gradeId) }),
    ...(search && { name: { contains: search, mode: 'insensitive' } })
  };

  // 실제 DB에서 불러올 조건, 반환 처리
  return await prisma.userCard.findMany({
    include: {
      photoCard: {
        include: { grade: true, genre: true }
      }
    },

    // 필터링 조건
    where: {
      ownerId: userId,
      status: { in: statusList },
      photoCard: photoCardFilter,

      // 판매 방법: 일반 판매 or 교환 제시 -- FE에서 받아와서 적용
      ...(saleType === '판매' && { saleUserCards: { some: {} } }), // 유형: 판매면 saleUserCards 다 가져와
      ...(saleType === '교환' && { tradeRequestUserCards: { some: {} } }) // 유형: 교환이면 tradeRequestUserCards 다 가져와
    },

    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: 'desc' }
  });
}

// GET: 내 판매 카드 개수 전체 조회 (판매중, 교환대기중, 판매 완료)
async function countMySales(
  userId,
  { genreId, gradeId, search, saleType, soldOut = 'false' } // soldOut 기본값을 문자열 "false"로 명시
) {
  const statusList = String(soldOut).toLowerCase() === 'true' ? ['SOLDOUT'] : ['AVAILABLE', 'PENDING'];

  const photoCardFilter = {
    ...(genreId && { genreId: Number(genreId) }),
    ...(gradeId && { gradeId: Number(gradeId) }),
    ...(search && { name: { contains: search, mode: 'insensitive' } })
  };

  return await prisma.userCard.count({
    where: {
      ownerId: userId,
      status: { in: statusList },
      photoCard: photoCardFilter,
      ...(saleType === '판매' && { saleUserCards: { some: {} } }),
      ...(saleType === '교환' && { tradeRequestUserCards: { some: {} } })
    }
  });
}

const usersRepository = {
  findById,
  findGenre,
  findGrade,
  create,
  findMyGallery,
  findMySales,
  getMonthlyCardCount,
  getCardsCount,
  countMySales
};

export default usersRepository;
