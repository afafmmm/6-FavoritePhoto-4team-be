import prisma from '../config/prisma.js';
import { startOfMonth, endOfMonth } from 'date-fns';
import countCardsByGrade from '../utils/countByGrade.js';

// ✅ 사용자 id 찾기
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

// ✅ 카드 장르 찾기
async function findGenre() {
  return await prisma.cardGenre.findMany({
    select: { id: true, name: true }
  });
}

// ✅ 카드 등급 찾기
async function findGrade() {
  return await prisma.cardGrade.findMany({
    select: { id: true, name: true }
  });
}

// ✅ 사용자별 카드 개수 세기
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

// ✅ POST
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

// ✅ 카드 생성 횟수 (월별)
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

// ✅ GET: 소유한 카드(거래·교환x)
async function findMyGallery(userId, { genre, grade, keyword, offset = 0, limit = 10 }) {
  // 1. query 문자열 조건절
  const whereClause = {
    userCards: {
      some: { ownerId: userId, status: 'ACTIVE' }
    }
  };

  if (grade) whereClause.grade = { id: Number(grade) };
  if (genre) whereClause.genre = { id: Number(genre) };
  if (keyword) whereClause.name = { contains: keyword, mode: 'insensitive' };

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

// 우주: 필터별 교집합 카운트 계산
async function countGalleryFilters(userId, { genre, grade, keyword }) {
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

  // 등급 카운트
  const gradeCounts = await prisma.photoCard.groupBy({
    by: ['gradeId'],
    where: whereClause,
    _count: { _all: true }
  });

  // 장르 카운트
  const genreCounts = await prisma.photoCard.groupBy({
    by: ['genreId'],
    where: whereClause,
    _count: { _all: true }
  });

  return {
    grade: gradeCounts.map((item) => ({
      gradeId: item.gradeId,
      count: item._count._all
    })),
    genre: genreCounts.map((item) => ({
      genreId: item.genreId,
      count: item._count._all
    }))
  };
}

// ✅ 판매 중인 카드
async function findMySales(
  userId,
  {
    genre,
    grade,
    keyword,
    saleType, // 전체, 판매, 교환 (품절x)
    sale, // 전체, 판매 중, 판매 완료
    offset = 0,
    limit = 10
  }
) {
  let sales = []; // 판매 상태 카드 목록
  let trade = []; // 교환 상태 카드 목록
  let totalSalesCards = 0;
  let totalTradeCards = 0;

  // 1-1. 공통 필터 조건
  // 1-1. 공통 필터 조건 생성 함수 (장르, 등급, 검색어만)
  const getCommonConditions = () => {
    const conditions = [];

    // 등급
    if (grade) {
      conditions.push({
        photoCard: { grade: { id: Number(grade) } }
      });
    }

    // 장르
    if (genre) {
      conditions.push({
        photoCard: { genre: { id: Number(genre) } }
      });
    }

    // 검색
    if (keyword) {
      conditions.push({
        photoCard: { name: { contains: keyword, mode: 'insensitive' } }
      });
    }

    return conditions;
  };

  // 2. 판매 중인 카드
  // saleStatus 조회하는데 자꾸 교환 데이터가 같이 나온다... 궁여지책으로 처리했다...
  if (sale) {
    if (saleType === 'PENDING') {
      return { totalItems: 0, items: [] };
    }

    if (sale === 'AVAILABLE' || sale === 'SOLDOUT') {
      const salesConditions = getCommonConditions();
      salesConditions.push({ status: sale });

      const salesWhereClause = {
        sellerId: userId,
        AND: salesConditions.length > 0 ? salesConditions : undefined
      };

      totalSalesCards = await prisma.sale.count({ where: salesWhereClause });

      console.log('salesWhereClause: ', salesWhereClause);
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

        where: salesWhereClause,
        skip: Number(offset),
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      });

      // 모양 바꿔서 반환
      sales = sales.map((item) => {
        const availableCards = item.saleUserCards.filter((card) => card.userCard.status === 'AVAILABLE').length;
        const soldOutCards = item.saleUserCards.filter((card) => card.userCard.status === 'SOLDOUT').length;

        return {
          ...item,
          saleQuantity: availableCards + soldOutCards
        };
      });
    }

    // saleStatus가 지정된 경우 교환 데이터는 조회하지 않음
    const items = [...sales];
    const totalItems = totalSalesCards;
    return { totalItems, items };
  }

  const fetchSalesCards = saleType === 'AVAILABLE' || !saleType;

  // 2-1. 판매 전용 조건
  if (fetchSalesCards) {
    const salesConditions = getCommonConditions();

    // ▣ 판매방법 필터
    if (saleType === 'AVAILABLE') salesConditions.push({ status: 'AVAILABLE' });

    // ▣ 매진 여부 필터 (sale modal만 가져옴)
    if (sale) {
      if (sale === 'AVAILABLE') {
        salesConditions.push({ status: 'AVAILABLE' });
      } else if (sale === 'SOLDOUT') {
        salesConditions.push({ status: 'SOLDOUT' });
      }
    }

    // 합침
    const salesWhereClause = {
      sellerId: userId,
      AND: salesConditions.length > 0 ? salesConditions : undefined
    };

    // 2-2. 판매 중인 카드 개수 셈
    totalSalesCards = await prisma.sale.count({ where: salesWhereClause });

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

      where: salesWhereClause,
      skip: Number(offset),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    // 2-4. 모양 바꿔서 반환
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
  const fetchTradeCards = saleType === 'PENDING' || !saleType;

  // 3-1. 교환 전용 조건
  if (fetchTradeCards) {
    const tradeConditions = getCommonConditions();

    // ▣ 판매 방법 필터
    if (saleType === 'PENDING') {
      tradeConditions.push({ tradeStatus: 'PENDING' });
    }

    const tradeWhereClause = {
      applicantId: userId,
      tradeStatus: 'PENDING',
      AND: tradeConditions.length > 0 ? tradeConditions : undefined
    };

    // 3-2. 교환 중인 카드 개수
    totalTradeCards = await prisma.tradeRequest.count({ where: tradeWhereClause });

    // 3-3. 데이터 불러옴
    trade = await prisma.tradeRequest.findMany({
      select: {
        id: true,
        tradeStatus: true,

        offeredPhotoCard: {
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

      where: tradeWhereClause,
      skip: Number(offset),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    trade = trade.map((item) => ({
      ...item,
      status: item.tradeStatus, // tradeStatus를 status로 변경
      price: item.offeredPhotoCard.initialPrice,
      saleQuantity: 1, // 교환은 1개로 고정
      photoCard: item.offeredPhotoCard
    }));
  }

  const items = [...sales, ...trade];

  // 4. 페이지네이션 적용
  const paginatedItems = items.slice(offset, offset + limit);
  const totalItems = totalSalesCards + totalTradeCards;
  return { totalItems, items: paginatedItems };
}

// Mobile 화면 필터
async function countSalesFilters(userId, { genre, grade, keyword, saleType, sale }) {
  const filterKeyword = keyword
    ? { name: { contains: keyword, mode: 'insensitive' } }
    : {};

  // 판매용 조건
  const saleWhere = {
    sellerId: userId,
    ...(sale ? { status: sale } : {}),
    photoCard: {
      ...(genre ? { genre: { id: Number(genre) } } : {}),
      ...(grade ? { grade: { id: Number(grade) } } : {}),
      ...filterKeyword,
    },
  };

  // 교환용 조건
  const tradeWhere = {
    ownerId: userId,
    ...(saleType ? { tradeStatus: saleType } : {}),
    photoCard: {
      ...(genre ? { genre: { id: Number(genre) } } : {}),
      ...(grade ? { grade: { id: Number(grade) } } : {}),
      ...filterKeyword,
    },
  };

  // 1) Sale에서 필터별 카운트 (photoCard의 genreId, gradeId 기준)
  const sales = await prisma.sale.findMany({
    where: saleWhere,
    select: {
      photoCard: {
        select: {
          genreId: true,
          gradeId: true,
        },
      },
    },
  });

  const gradeMap = new Map();
  const genreMap = new Map();

  for (const sale of sales) {
    const gradeId = sale.photoCard?.gradeId;
    const genreId = sale.photoCard?.genreId;

    if (gradeId) {
      gradeMap.set(gradeId, (gradeMap.get(gradeId) || 0) + 1);
    }
    if (genreId) {
      genreMap.set(genreId, (genreMap.get(genreId) || 0) + 1);
    }
  }

  // 전체 판매 상태별 카운트 (필터 없이)
  const saleStatusCounts = await prisma.sale.groupBy({
    by: ['status'],
    where: { sellerId: userId },
    _count: { _all: true },
  });

  // 2) TradeRequest에서 필터별 카운트
  const tradeStatusCounts = await prisma.tradeRequest.groupBy({
    by: ['tradeStatus'],
    where: { ownerId: userId },
    _count: { _all: true },
  });

  // photoCard 기준 groupBy 후 개수 세기
  const tradePhotoCardCounts = await prisma.tradeRequest.groupBy({
    by: ['photoCardId'],
    where: tradeWhere,
    _count: { _all: true },
  });

  const tradePhotoCards = await prisma.photoCard.findMany({
    where: {
      id: { in: tradePhotoCardCounts.map((t) => t.photoCardId) },
    },
    select: {
      id: true,
      gradeId: true,
      genreId: true,
    },
  });

  const tradeGradeMap = new Map();
  const tradeGenreMap = new Map();

  for (const card of tradePhotoCards) {
    const match = tradePhotoCardCounts.find((t) => t.photoCardId === card.id);
    if (!match) continue;

    if (card.gradeId) {
      tradeGradeMap.set(
        card.gradeId,
        (tradeGradeMap.get(card.gradeId) || 0) + match._count._all
      );
    }
    if (card.genreId) {
      tradeGenreMap.set(
        card.genreId,
        (tradeGenreMap.get(card.genreId) || 0) + match._count._all
      );
    }
  }

  // grade, genre 최종 합산
  const combinedGradeCounts = new Map(gradeMap);
  const combinedGenreCounts = new Map(genreMap);

  for (const [gradeId, count] of tradeGradeMap.entries()) {
    combinedGradeCounts.set(
      gradeId,
      (combinedGradeCounts.get(gradeId) || 0) + count
    );
  }
  for (const [genreId, count] of tradeGenreMap.entries()) {
    combinedGenreCounts.set(
      genreId,
      (combinedGenreCounts.get(genreId) || 0) + count
    );
  }

  return {
    grade: Array.from(combinedGradeCounts.entries()).map(([gradeId, count]) => ({
      gradeId,
      count,
    })),
    genre: Array.from(combinedGenreCounts.entries()).map(([genreId, count]) => ({
      genreId,
      count,
    })),
    sale: saleStatusCounts.map((item) => ({
      status: item.status,
      count: item._count._all,
    })),
    saleType: tradeStatusCounts.map((item) => ({
      saleType: item.tradeStatus,
      count: item._count._all,
    })),
  };
}


//--특정 유저의 포토카드 상세 (우주)
async function getUserPhotoCardDetail(userId, photoCardId) {
  return await prisma.userCard.findMany({
    where: {
      ownerId: userId,
      photoCardId: photoCardId
    },
    include: {
      photoCard: {
        include: {
          genre: true,
          grade: true,
          creator: {
            select: {
              id: true,
              nickname: true
            }
          }
        }
      },
      owner: {
        select: {
          id: true,
          nickname: true,
          profileImage: true
        }
      },
      saleUserCards: true,
      tradeRequestUserCards: true
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
  getUserPhotoCardDetail,
  countGalleryFilters,
  countSalesFilters
};

export default usersRepository;
