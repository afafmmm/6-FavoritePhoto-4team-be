import prisma from "../config/prisma.js";

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
      updatedAt: true,
    },
  });
}

// 카드 장르 찾기
async function findGenre() {
  return await prisma.cardGenre.findMany({
    select: { id: true, name: true },
  });
}

// 카드 등급 찾기
async function findGrade() {
  return await prisma.cardGrade.findMany({
    select: { id: true, name: true },
  });
}

// POST
async function create(query) {
  const { name, grade, genre, description, volumn, price, image, creatorId } =
    query;

  const imageUrl = `/uploads/${image.filename}`;
  const gradeRecord = await prisma.cardGrade.findUnique({
    where: { name: grade },
  });
  const genreRecord = await prisma.cardGenre.findUnique({
    where: { name: genre },
  });

  if (!gradeRecord || !genreRecord) {
    throw new Error("존재하지 않는 등급 또는 장르입니다.");
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
      creatorId,
    },
  });

  // 제작한 photoCard는 만든 이에게 귀속됨 -- 발행량만큼 생성되어야 함
  const userCards = Array.from({ length: parseInt(volumn, 10) }).map(() => ({
    photoCardId: photoCard.id,
    ownerId: creatorId,
    price: parseInt(price, 10),
  }));

  await prisma.userCard.createMany({
    data: userCards,
  });

  return photoCard;
}

// ----------- //

// GET: 소유한 카드(거래·교환x)
async function findMyGallery(
  userId,
  { genreId, gradeId, search, offset = 0, limit = 10 }
) {
  // query string 조건 정리 (밑의 where절로)
  const photoCardFilter = {
    // 카드 관련 조건: &&로 유무를 검사하고, 있으면 조건으로 넣어라(spread 문법)
    ...(genreId && { genreId: Number(genreId) }), // 조건3: 카드 장르
    ...(gradeId && { gradeId: Number(gradeId) }), // 조건4: 카드 등급
    ...(search && { name: { contains: search, mode: "insensitive" } }), // 조건5: 검색어 = 카드 이름
  };

  // { } 안은 query string 부분
  return await prisma.userCard.findMany({
    // 불러올 내용: userCard 전체 + 등급과 장르
    include: {
      photoCard: {
        include: { grade: true, genre: true },
      },
    },

    // 필터링 조건
    where: {
      ownerId: userId, // 조건1: 로그인한 userId
      status: "ACTIVE", // 조건2: 카드 상태
      photoCard: photoCardFilter,
    },

    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: "desc" },
  });
}

// GET: 판매 중인 카드
async function findMySales(
  userId,
  {
    genreId,
    gradeId,
    search,
    saleType, // 판매 중, 교환 요청됨, undefined(품절된 것?)
    soldOut = false, // true(품절됨), false(그 외 = 판매or교환 중) -- FE에서 보냄
    offset = 0,
    limit = 10,
  }
) {
  // 상태: ABAILABLE(판매 중), PENDING(교환 중), SOLDOUT(품절)
  const statusList =
    soldOut === "true" ? ["SOLDOUT"] : ["AVAILABLE", "PENDING"];

  // saleType 정의
  const allowedSaleTypes = ["판매", "교환"];
  if (saleType && !allowedSaleTypes.includes(saleType)) {
    const error = new Error("판매 유형은 '판매', '교환' 중 택1");
    error.code = 400;
    throw error;
  }

  // query string 조건 정리22
  const photoCardFilter = {
    ...(genreId && { genreId: Number(genreId) }),
    ...(gradeId && { gradeId: Number(gradeId) }),
    ...(search && { name: { contains: search, mode: "insensitive" } }),
  };

  // 실제 DB에서 불러올 조건, 반환 처리
  return await prisma.userCard.findMany({
    include: {
      photoCard: {
        include: { grade: true, genre: true },
      },
    },

    // 필터링 조건
    where: {
      ownerId: userId,
      status: { in: statusList },
      photoCard: photoCardFilter,

      // 판매 방법: 일반 판매 or 교환 제시 -- FE에서 받아와서 적용
      ...(saleType === "판매" && { saleUserCards: { some: {} } }), // 유형: 판매면 saleUserCards 다 가져와
      ...(saleType === "교환" && { tradeRequestUserCards: { some: {} } }), // 유형: 교환이면 tradeRequestUserCards 다 가져와
    },

    skip: Number(offset),
    take: Number(limit),
    orderBy: { createdAt: "desc" },
  });
}

const usersRepository = {
  findById,
  findGenre,
  findGrade,
  create,
  findMyGallery,
  findMySales,
};

export default usersRepository;
