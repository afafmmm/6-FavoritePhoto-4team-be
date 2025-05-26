import prisma from "../config/prisma.js";

async function findSaleCardById(id) {
  return await prisma.sale.findUnique({
    where: { id },
    include: {
      photoCard: {
        include: {
          genre: true,
          grade: true,
          creator: {
            select: { id: true, nickname: true, profileImage: true },
          },
        },
      },
      seller: {
        select: { id: true, nickname: true, profileImage: true },
      },
      // cardGrade: true,
      // cardGenre: true,
    },
  });
}

  // 카드 목록 조회
async function findAllSalesWithCounts() {

  const sales = await prisma.sale.findMany({
    include: {
      photoCard: {
        include: {
          grade: true,
          genre: true,
        },
      },
      seller: {
        select: {
          id: true,
          nickname: true,
          profileImage: true,
        },
      },
      // cardGrade: true,
      // cardGenre: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // 필터 카운트 조회 (판매 중 카드만 카운트)
  const [gradeCounts, genreCounts, saleCounts] = await Promise.all([
    prisma.sale.groupBy({
      by: ['cardGradeId'],
      _count: true,
      where: {
        status: 'AVAILABLE',
      },
    }),
    prisma.sale.groupBy({
      by: ['cardGenreId'],
      _count: true,
      where: {
        status: 'AVAILABLE',
      },
    }),
    prisma.sale.groupBy({
      by: ['status'],
      _count: true,
    }),
  ]);

  return {
    sales,
    counts: {
      grade: gradeCounts.map(item => ({
        gradeId: item.cardGradeId,
        count: item._count,
      })),
      genre: genreCounts.map(item => ({
        genreId: item.cardGenreId,
        count: item._count,
      })),
      sale: saleCounts.map(item => ({
        status: item.status,
        count: item._count,
      })),
    },
  };
}

export default {
  findSaleCardById,
  findAllSalesWithCounts,
};
