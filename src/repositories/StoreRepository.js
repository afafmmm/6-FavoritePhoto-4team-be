import prisma from '../config/prisma.js';
import getSort from '../utils/sort.js';
import { getGenreFilter, getGradeFilter, getStatusFilter } from '../utils/filter.js'; 

const findSalesByFilters = async ({ grade, genre, orderBy = '낮은 가격순', sale }) => {
  const where = {};

  if (grade?.length) {
    const gradeNames = grade
      .map(Number)
      .map(getGradeFilter)
      .map((obj) => obj.name);
    where.photoCard = {
      grade: {
        name: { in: gradeNames }
      }
    };
  }

  if (genre?.length) {
    const genreNames = genre
      .map(Number)
      .map(getGenreFilter)
      .map((obj) => obj.name);
    where.photoCard = {
      ...where.photoCard,
      genre: {
        name: { in: genreNames }
      }
    };
  }

  if (sale?.length) {
    const statusFilter = getStatusFilter(sale);
    where.status = { in: statusFilter };
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
