import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 데이터 초기화
  // 기존 데이터 삭제
  await prisma.tradeRequest.deleteMany(); // 교환 요청 데이터 삭제
  await prisma.sale.deleteMany(); // 판매 데이터 삭제
  await prisma.userCard.deleteMany(); // 유저 카드 데이터 삭제
  await prisma.photoCard.deleteMany(); // 포토카드 데이터 삭제
  await prisma.notification.deleteMany(); // 알림 데이터 삭제
  await prisma.userPoint.deleteMany(); // 유저 포인트 데이터 삭제
  await prisma.user.deleteMany(); // 유저 데이터 삭제

  console.log("기존 데이터 초기화 완료");

  // 5명의 사용자 생성
  const users = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.user.create({
        data: {
          email: `user${i + 1}@example.com`,
          nickname: `User${i + 1}`,
          password: `password${i + 1}`,
        },
      })
    )
  );

  console.log("사용자 데이터 생성 완료");

  // 5개의 포토카드와 해당 유저카드 생성
  const photoCards = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.photoCard.create({
        data: {
          name: `PhotoCard${i + 1}`,
          imageUrl: `https://example.com/photo${i + 1}.jpg`,
          grade: "COMMON",
          genre: "TRAVEL",
          description: `Description for PhotoCard${i + 1}`,
          totalQuantity: 10,
          ownerId: users[i % users.length].id, // 첫 소유주는 카드 생성자
          userCards: {
            create: Array.from({ length: 10 }).map(() => ({
              ownerId: users[i % users.length].id, // 첫 소유주 설정
              status: "ACTIVE",
            })),
          },
        },
      })
    )
  );

  console.log("포토카드 및 유저카드 데이터 생성 완료");

  // 교환 요청 데이터 생성
  await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.tradeRequest.create({
        data: {
          listedCardId: i + 1, // UserCard ID 사용
          applicantCardId: ((i + 3) % 5) + 1, // 순환 참조로 다양성 추가
          description: `PhotoCard${i + 1}에 대한 교환 요청`,
          tradeStatus: "PENDING",
        },
      })
    )
  );

  console.log("교환 요청 데이터 생성 완료");

  // 판매 데이터 생성
  await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.sale.create({
        data: {
          userCardId: i + 1, // UserCard ID 사용
          sellerId: users[i % users.length].id, // 기존 사용자 중 판매자 설정
          price: (i + 1) * 1000, // 가격 설정
          status: "AVAILABLE",
        },
      })
    )
  );

  console.log("판매 데이터 생성 완료");

  // 각 사용자에게 알림과 포인트 생성
  await Promise.all(
    users.map((user, i) =>
      Promise.all([
        prisma.notification.create({
          data: {
            userId: user.id,
            message: `User${i + 1}님, 새로운 알림이 도착했습니다!`, // 알림 메시지 한글로 작성
            read: false,
          },
        }),
        prisma.userPoint.create({
          data: {
            userId: user.id,
            points: (i + 1) * 100, // 사용자별 포인트 설정
            lastClaimed: new Date(),
          },
        }),
      ])
    )
  );

  console.log("알림 및 포인트 데이터 생성 완료");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
