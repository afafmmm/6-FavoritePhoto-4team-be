import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create UserPoints
  const userPoints = await prisma.userPoint.createMany({
    data: [
      { userId: 2, points: 100 },
      { userId: 3, points: 200 },
      { userId: 4, points: 300 },
      { userId: 5, points: 400 },
      { userId: 6, points: 500 },
    ],
  });

  // Create PhotoCards
  const photoCards = await prisma.photoCard.createMany({
    data: [
      { ownerId: 2, name: "Card1", imageUrl: "url1", totalSupply: 10 },
      { ownerId: 3, name: "Card2", imageUrl: "url2", totalSupply: 20 },
      { ownerId: 4, name: "Card3", imageUrl: "url3", totalSupply: 30 },
      { ownerId: 5, name: "Card4", imageUrl: "url4", totalSupply: 40 },
      { ownerId: 6, name: "Card5", imageUrl: "url5", totalSupply: 50 },
    ],
  });

  // Create MarketListings
  const marketListings = await prisma.marketListing.createMany({
    data: [
      { sellerId: 2, photoCardId: 1, price: 100 },
      { sellerId: 3, photoCardId: 2, price: 200 },
      { sellerId: 4, photoCardId: 3, price: 300 },
      { sellerId: 5, photoCardId: 4, price: 400 },
      { sellerId: 6, photoCardId: 5, price: 500 },
    ],
  });

  // Create TradeOffers
  const tradeOffers = await prisma.tradeOffer.createMany({
    data: [
      { buyerId: 2, sellerId: 3, offeredCardId: 1, requestedCardId: 2 },
      { buyerId: 3, sellerId: 4, offeredCardId: 2, requestedCardId: 3 },
      { buyerId: 4, sellerId: 5, offeredCardId: 3, requestedCardId: 4 },
      { buyerId: 5, sellerId: 6, offeredCardId: 4, requestedCardId: 5 },
      { buyerId: 6, sellerId: 2, offeredCardId: 5, requestedCardId: 1 },
    ],
  });

  // Create Notifications
  const notifications = await prisma.notification.createMany({
    data: [
      { userId: 2, message: "Notification 1" },
      { userId: 3, message: "Notification 2" },
      { userId: 4, message: "Notification 3" },
      { userId: 5, message: "Notification 4" },
      { userId: 6, message: "Notification 5" },
    ],
  });

  console.log("Mock data inserted successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
