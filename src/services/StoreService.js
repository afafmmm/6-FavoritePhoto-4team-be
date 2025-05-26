import storeRepository from '../repositories/StoreRepository.js';

const parseFilterValue = (value) => {
  if (!value) return [];
  if (value.includes(",")) {
    return value.split(",").map((v) => v.trim());
  }
  return [value.trim()];
};

const getFilteredSalesWithCounts = async ({ grade, genre, sale }) => {
  // 필터 쿼리를 배열로 파싱
  const gradeFilter = parseFilterValue(grade);
  const genreFilter = parseFilterValue(genre);
  const saleFilter = sale ? [sale] : [];

  // 필터를 이용해 데이터 조회
  const sales = await storeRepository.findSalesByFilters({
    grade: gradeFilter,
    genre: genreFilter,
    sale: saleFilter,
  });

  // 필터 별 counts 집계 (필터링된 sales 기준)
  const counts = {
    grade: [],
    genre: [],
    sale: [],
  };

  // grade 카운트 집계
  const gradeCountMap = {};
  sales.forEach((sale) => {
    const id = sale.cardGrade?.id;
    if (id) gradeCountMap[id] = (gradeCountMap[id] || 0) + 1;
  });
  counts.grade = Object.entries(gradeCountMap).map(([gradeId, count]) => ({
    gradeId: Number(gradeId),
    count,
  }));

  // genre 카운트 집계
  const genreCountMap = {};
  sales.forEach((sale) => {
    const id = sale.cardGenre?.id;
    if (id) genreCountMap[id] = (genreCountMap[id] || 0) + 1;
  });
  counts.genre = Object.entries(genreCountMap).map(([genreId, count]) => ({
    genreId: Number(genreId),
    count,
  }));

  // sale 상태별 카운트 집계
  const saleCountMap = {};
  sales.forEach((sale) => {
    const status = sale.status;
    if (status) saleCountMap[status] = (saleCountMap[status] || 0) + 1;
  });
  counts.sale = Object.entries(saleCountMap).map(([status, count]) => ({
    status,
    count,
  }));

  return { sales, counts };
};



async function getCardById(cardId) {
  const card = await storeRepository.findSaleCardById(cardId);
  return card;
}
async function getFilterCounts() {
  return await storeRepository.countFilters();
}


export default {
  getFilteredSalesWithCounts,
  getCardById,
  getFilterCounts
};
