import prisma from '../config/prisma.js';
import getSort from '../utils/sort.js';

// 필터 파싱 함수 (grade, genre는 배열 또는 콤마 구분 문자열로 전달됨 가정)
function parseFilterArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(Number);
  return value.split(',').map(Number);
}

const findSalesByFilters = async ({ grade, genre, orderBy = '낮은 가격순', sale }) => {
  // prisma에서 조건 객체 생성
  const where = {};

  if (grade.length) {
    where.cardGradeId = { in: grade.map(Number) };
  }

  if (genre.length) {
    where.cardGenreId = { in: genre.map(Number) };
  }

  if (sale.length) {
    where.status = { in: sale };
  }

  // 실제 DB 조회 (관련된 cardGrade, cardGenre 포함)
  return await prisma.sale.findMany({
    where,
    orderBy: getSort('card', orderBy),
    include: {
      photoCard: {
        include: {
          genre: true,
          grade: true,
          creator: {
            select: { id: true, nickname: true, profileImage: true }
          }
        }
      },
      seller: {
        select: { id: true, nickname: true, profileImage: true }
      },
      cardGrade: true,
      cardGenre: true
    }
  });
};

async function countFilters() {
  const [gradeCounts, genreCounts, saleCounts] = await Promise.all([
    prisma.sale.groupBy({
      by: ['cardGradeId'],
      _count: true,
      where: {
        status: 'AVAILABLE'
      }
    }),
    prisma.sale.groupBy({
      by: ['cardGenreId'],
      _count: true,
      where: {
        status: 'AVAILABLE'
      }
    }),
    prisma.sale.groupBy({
      by: ['status'],
      _count: true
    })
  ]);

  return {
    grade: gradeCounts.map((item) => ({
      gradeId: item.cardGradeId,
      count: item._count
    })),
    genre: genreCounts.map((item) => ({
      genreId: item.cardGenreId,
      count: item._count
    })),
    sale: saleCounts.map((item) => ({
      status: item.status,
      count: item._count
    }))
  };
}

async function findSaleCardById(id) {
  return await prisma.sale.findUnique({
    where: { id },
    include: {
      photoCard: {
        include: {
          genre: true,
          grade: true,
          creator: {
            select: { id: true, nickname: true, profileImage: true }
          }
        }
      },
      seller: {
        select: { id: true, nickname: true, profileImage: true }
      },
      cardGrade: true,
      cardGenre: true
    }
  });
}

export default {
  findSaleCardById,
  countFilters,
  findSalesByFilters
};
