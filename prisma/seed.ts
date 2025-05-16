import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

async function main() {
  // 목 데이터 로드
  const users = JSON.parse(
    fs.readFileSync("./prisma/mockData/user.json", "utf-8")
  );
  const userPoints = JSON.parse(
    fs.readFileSync("./prisma/mockData/userPoint.json", "utf-8")
  );
  const photoCards = JSON.parse(
    fs.readFileSync("./prisma/mockData/photoCards.json", "utf-8")
  );
  const cardGrades = JSON.parse(
    fs.readFileSync("./prisma/mockData/cardGrade.json", "utf-8")
  );
  const cardGenres = JSON.parse(
    fs.readFileSync("./prisma/mockData/cradGenre.json", "utf-8")
  );

  // 사용자 데이터 삽입
  for (const user of users) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        googleId: user.googleId,
        password: user.password,
        nickname: user.nickname,
        profileImage: user.profileImage,
        createdAt: new Date(user.createdAt),
      },
    });
  }

  // 사용자 포인트 데이터 삽입
  for (const userPoint of userPoints) {
    await prisma.userPoint.create({
      data: {
        id: userPoint.id,
        userId: userPoint.userId,
        points: userPoint.points,
        lastClaimed: userPoint.lastClaimed
          ? new Date(userPoint.lastClaimed)
          : null,
      },
    });
  }

  // 카드 등급 데이터 삽입
  for (const cardGrade of cardGrades) {
    await prisma.cardGrade.create({
      data: {
        id: cardGrade.id,
        name: cardGrade.name,
      },
    });
  }

  // 카드 장르 데이터 삽입
  for (const cardGenre of cardGenres) {
    await prisma.cardGenre.create({
      data: {
        id: cardGenre.id,
        name: cardGenre.name,
      },
    });
  }

  // 포토카드 및 사용자 카드 데이터 삽입
  for (const photoCard of photoCards) {
    await prisma.photoCard.create({
      data: {
        id: photoCard.id,
        name: photoCard.name,
        imageUrl: photoCard.imageUrl,
        gradeId: photoCard.gradeId,
        genreId: photoCard.genreId,
        description: photoCard.description,
        totalQuantity: photoCard.totalQuantity,
        initialPrice: photoCard.initialPrice,
        creatorId: photoCard.creatorId,
        createdAt: new Date(photoCard.createdAt),
      },
    });

    // 각 포토카드에 대해 사용자 카드 생성
    for (let i = 0; i < photoCard.totalQuantity; i++) {
      await prisma.userCard.create({
        data: {
          photoCardId: photoCard.id,
          ownerId: photoCard.creatorId, // 생성자를 첫 소유자로 지정 (photoCard.id → photoCard.creatorId)
          price: photoCard.initialPrice,
          status: "ACTIVE",
          createdAt: new Date(),
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
