import prisma from '../config/prisma.js';
import getSort from '../utils/sort.js';
import { getGenreFilter, getGradeFilter, getStatusFilter } from '../utils/filter.js'; 

const findSalesByFilters = async ({ grade, genre, orderBy = '낮은 가격순', sale, keyword }) => {
  const where = {
    AND: []
  };

  const photoCardConditions = {};

  // 등급 필터
  if (grade?.length) {
    const gradeNames = grade
      .map(Number)
      .map(getGradeFilter)
      .map(obj => obj.name);

    photoCardConditions.grade = {
      name: { in: gradeNames }
    };
  }

  // 장르 필터
  if (genre?.length) {
    const genreNames = genre
      .map(Number)
      .map(getGenreFilter)
      .map(obj => obj.name);

    photoCardConditions.genre = {
      name: { in: genreNames }
    };
  }

  // 키워드 검색 필터
  if (keyword) {
    where.AND.push({
      OR: [
        { photoCard: { name: { contains: keyword, mode: 'insensitive' } } },
        { seller: { nickname: { contains: keyword, mode: 'insensitive' } } }
        // 필요하면 설명(description)도 추가 가능
        // { photoCard: { description: { contains: keyword, mode: 'insensitive' } } }
      ]
    });
  }

  // 상태 필터
  if (sale?.length) {
    const statusFilter = getStatusFilter(sale);
    where.AND.push({
      status: { in: statusFilter }
    });
  }

  // photoCard 조건 병합
  if (Object.keys(photoCardConditions).length > 0) {
    where.AND.push({ photoCard: photoCardConditions });
  }

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
      _count: { _all: true },
      where: { status: 'AVAILABLE' }
    }),
    prisma.sale.groupBy({
      by: ['cardGenreId'],
      _count: { _all: true },
      where: { status: 'AVAILABLE' }
    }),
    prisma.sale.groupBy({
      by: ['status'],
      _count: { _all: true }
    })
  ]);

  return {
    grade: gradeCounts.map(item => ({
      gradeId: item.cardGradeId,
      count: item._count._all
    })),
    genre: genreCounts.map(item => ({
      genreId: item.cardGenreId,
      count: item._count._all
    })),
    sale: saleCounts.map(item => ({
      status: item.status,
      count: item._count._all
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
