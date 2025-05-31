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
  // 1. 일단 userCard에서 등급별 전체 개수를 불러옴
  const allCards = await prisma.userCard.findMany({
    where: {
      ownerId: userId
    },
    include: {
      photoCard: { select: { id: true, gradeId: true } }
    }
  });

  // 2. photoCard 기준으로 바꿈
  const getPhotoCardCount = (cards) =>
    Array.from(new Map(cards.map((card) => [card.photoCard.id, card.photoCard])).values());

  // 3. 카드 상태를 active와 그 외로 나눔
  const active = getPhotoCardCount(allCards.filter((card) => card.status === 'ACTIVE'));
  const inactive = getPhotoCardCount(allCards.filter((card) => card.status !== 'ACTIVE'));

  // 4. 등급별로 반환함
  return {
    active: countCardsByGrade(active),
    inactive: countCardsByGrade(inactive)
  };
}

// POST
async function create(query) {
  const { name, grade, genre, description, volumn, price, image, creatorId } = query;

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
      imageUrl: image, // image가 Cloudinary URL
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
async function findMyGallery(userId, { genre, grade, keyword, offset = 0, limit = 10 }) {
  // 1. query 문자열 조건절
  const whereClause = {
    userCards: {
      some: { ownerId: userId, status: 'ACTIVE' }
    }
  };

  if (grade) {
    whereClause.grade = { id: Number(grade) };
  }
  if (genre) {
    whereClause.genre = { id: Number(genre) };
  }
  if (keyword) {
    whereClause.name = { contains: keyword, mode: 'insensitive' };
  }

  // 2. 전체 카드 개수 (count 쿼리)
  const totalItems = await prisma.photoCard.count({
    where: whereClause
  });

  // 3. 페이지네이션 포함 쿼리 문자열 반환
  const items = await prisma.photoCard.findMany({
    select: {
      id: true,
      name: true,
      imageUrl: true,
      description: true,
      totalQuantity: true,
      grade: { select: { id: true, name: true } },
      genre: { select: { id: true, name: true } },
      userCards: {
        where: { ownerId: userId, status: 'ACTIVE' },
        select: { id: true, price: true, owner: { select: { id: true, nickname: true } } }
      },
      creator: { select: { id: true, nickname: true } }
    },

    where: whereClause,
    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: 'desc' }
  });

  return { totalItems, items };
}

// ------------ //
// 판매 중인 카드 //
// ----------- //

async function findMySales(
  userId,
  {
    genre,
    grade,
    keyword,
    saleType, // 전체, 판매, 교환 (품절x)
    saleStatus, // 전체, 판매 중, 판매 완료
    offset = 0,
    limit = 10
  }
) {
  let sales = []; // 판매 상태 카드 목록
  let trade = []; // 교환 상태 카드 목록
  let totalSalesCards = 0;
  let totalTradeCards = 0;

  // 1-1. 공통 필터 조건
  const whereClause = { AND: [] };

  // 등급
  if (grade) {
    whereClause.AND.push({
      photoCard: { grade: { id: Number(grade) } }
    });
  }

  // 장르
  if (genre) {
    whereClause.AND.push({
      photoCard: { genre: { id: Number(genre) } }
    });
  }

  // 검색
  if (keyword) {
    whereClause.AND.push({
      photoCard: { name: { contains: keyword, mode: 'insensitive' } }
    });
  }

  // 매진 여부
  if (saleStatus) {
    if (saleStatus === 'AVAILABLE') {
      whereClause.AND.push({ status: 'AVAILABLE' });
    } else if (saleStatus === 'SOLDOUT') {
      whereClause.AND.push({ status: 'SOLDOUT' });
    }
  }

  // 판매방법
  if (saleType) {
    if (saleType === 'AVAILABLE') {
      whereClause.AND.push({ status: 'AVAILABLE' });
    } else if (saleType === 'PENDING') {
      whereClause.AND.push({ tradeStatus: 'PENDING' });
    }
  }

  // 2. 판매 중인 카드
  const fetchSalesCards = saleType === 'AVAILABLE' || !saleType; // 2-1. 불러오는 조건1: 전체 다 or 판매인 것만
  if (fetchSalesCards) {
    const salesWhereClause = { sellerId: userId }; // 조건2: 사용자

    // 2-2. 판매 중인 카드 개수 셈
    totalSalesCards = await prisma.sale.count({
      where: { ...salesWhereClause, ...whereClause }
    });

    // 2-3. 데이터 불러옴
    sales = await prisma.sale.findMany({
      select: {
        id: true,
        price: true,
        saleQuantity: true,
        status: true,

        photoCard: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            description: true,
            initialPrice: true,
            grade: { select: { id: true, name: true } },
            genre: { select: { id: true, name: true } },
            creator: { select: { id: true, nickname: true } }
          }
        },
        saleUserCards: {
          select: {
            userCard: { select: { id: true, status: true } }
          }
        }
      },

      where: { ...salesWhereClause, ...whereClause }, // 2-4. 조건 다 적용
      skip: Number(offset),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    // 3-5. 모양 바꿔서 반환
    sales = sales.map((item) => {
      // 판매 중인 카드 수량
      const availableCards = item.saleUserCards.filter((card) => card.userCard.status === 'AVAILABLE').length;

      // 품절 카드 수량
      const soldOutCards = item.saleUserCards.filter((card) => card.userCard.status === 'SOLDOUT').length;

      return {
        ...item,
        saleQuantity: availableCards + soldOutCards // 상태별로 수량 계산
      };
    });
  }

  // 3. 교환 중인 카드
  const fetchTradeCards = saleType === 'PENDING' || !saleType; // 3-1. 불러오는 조건1: 전체 다 or 교환

  if (fetchTradeCards) {
    const tradeWhereClause = { ownerId: userId, tradeStatus: 'PENDING' }; // 조건2: 사용자, state

    // 3-2. 교환 중인 카드 개수
    totalTradeCards = await prisma.tradeRequest.count({
      where: { ...tradeWhereClause, ...whereClause }
    });

    // 3-3. 데이터 불러옴
    trade = await prisma.tradeRequest.findMany({
      select: {
        id: true,
        tradeStatus: true,

        photoCard: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            initialPrice: true,
            description: true,
            grade: { select: { id: true, name: true } },
            genre: { select: { id: true, name: true } },
            creator: { select: { id: true, nickname: true } }
          }
        }
      },

      where: { ...tradeWhereClause, ...whereClause }, // 3-4
      skip: Number(offset),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    trade = trade.map((item) => ({
      ...item,
      status: item.tradeStatus, // tradeStatus를 status로 변경
      price: item.photoCard.initialPrice,
      saleQuantity: 1 // 교환은 1개로 고정
    }));
  }

  const items = [...sales, ...trade];

  // 4. 페이지네이션 적용
  const paginatedItems = items.slice(offset, offset + limit);
  const totalItems = totalSalesCards + totalTradeCards;
  return { totalItems, items: paginatedItems };
}

const usersRepository = {
  findById,
  findGenre,
  findGrade,
  create,
  findMyGallery,
  findMySales,
  getMonthlyCardCount,
  getCardsCount
};

export default usersRepository;
