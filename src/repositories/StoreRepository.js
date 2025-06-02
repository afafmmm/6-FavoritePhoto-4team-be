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
      .map((obj) => obj.name);

    photoCardConditions.grade = {
      name: { in: gradeNames }
    };
  }

  // 장르 필터
  if (genre?.length) {
    const genreNames = genre
      .map(Number)
      .map(getGenreFilter)
      .map((obj) => obj.name);

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

async function countFilters({ grade, genre, sale, keyword }) {
  const where = {
    AND: []
  };

  const photoCardConditions = {};

  // grade 필터
  if (grade?.length) {
    const gradeNames = grade
      .map(Number)
      .map(getGradeFilter)
      .map((obj) => obj.name);
    photoCardConditions.grade = { name: { in: gradeNames } };
  }

  // genre 필터
  if (genre?.length) {
    const genreNames = genre
      .map(Number)
      .map(getGenreFilter)
      .map((obj) => obj.name);
    photoCardConditions.genre = { name: { in: genreNames } };
  }

  // photoCardConditions에 조건이 있으면 AND에 추가
  if (Object.keys(photoCardConditions).length > 0) {
    where.AND.push({ photoCard: photoCardConditions });
  }

  // keyword 필터
  if (keyword) {
    where.AND.push({
      OR: [
        { photoCard: { name: { contains: keyword, mode: 'insensitive' } } },
        { seller: { nickname: { contains: keyword, mode: 'insensitive' } } }
      ]
    });
  }

  // sale (status) 필터
  if (sale?.length) {
    const statusFilter = getStatusFilter(sale);
    where.AND.push({ status: { in: statusFilter } });
  }

  // 여기서부터는 필터링된 판매 항목 조회 및 집계 로직

  // 1. 필터링된 판매 항목에서 photoCard의 gradeId와 genreId 가져오기
  const filteredSales = await prisma.sale.findMany({
    where,
    select: {
      photoCard: {
        select: {
          gradeId: true,
          genreId: true
        }
      }
    }
  });

  // 2. 클라이언트에서 groupBy 처리
  const gradeCountMap = {};
  const genreCountMap = {};

  for (const sale of filteredSales) {
    const { gradeId, genreId } = sale.photoCard;
    if (gradeId != null) {
      gradeCountMap[gradeId] = (gradeCountMap[gradeId] || 0) + 1;
    }
    if (genreId != null) {
      genreCountMap[genreId] = (genreCountMap[genreId] || 0) + 1;
    }
  }

  const gradeCounts = Object.entries(gradeCountMap).map(([gradeId, count]) => ({
    gradeId: Number(gradeId),
    count
  }));

  const genreCounts = Object.entries(genreCountMap).map(([genreId, count]) => ({
    genreId: Number(genreId),
    count
  }));

  // 3. 상태 count는 그대로 Prisma groupBy 사용
  const saleCounts = await prisma.sale.groupBy({
    by: ['status'],
    _count: { _all: true },
    where
  });

  return {
    grade: gradeCounts,
    genre: genreCounts,
    sale: saleCounts.map((item) => ({
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
