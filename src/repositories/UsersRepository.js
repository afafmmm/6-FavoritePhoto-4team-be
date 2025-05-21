import prisma from "../config/prisma.js";

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

  if (!gradeRecord) {
    throw new Error(`해당 등급(${grade})이 존재하지 않습니다.`);
  }
  if (!genreRecord) {
    throw new Error(`해당 장르(${genre})가 존재하지 않습니다.`);
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

  // 제작한 photoCard는 만든 이에게 귀속됨
  await prisma.userCard.create({
    data: {
      photoCardId: photoCard.id,
      ownerId: creatorId,
      price: parseInt(price, 10),
    },
  });

  return photoCard;
}

const usersRepository = { findGenre, findGrade, create };

export default usersRepository;
