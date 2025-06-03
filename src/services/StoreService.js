import storeRepository from '../repositories/StoreRepository.js';
import { getStatusFilter } from '../utils/filter.js';

function parseFilterValue(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(',').map(v => v.trim());
  }
  return [String(value)];
}

const getFilteredSalesWithCounts = async ({
  grade, genre, sale, orderBy, keyword, withCounts = false, page = 1, limit = 12
}) => {
  const gradeFilter = parseFilterValue(grade);
  const genreFilter = parseFilterValue(genre);
  const saleFilterRaw = parseFilterValue(sale);
  const saleFilter = getStatusFilter(saleFilterRaw);

  const salesPromise = storeRepository.findSalesByFilters({
    grade: gradeFilter,
    genre: genreFilter,
    sale: saleFilter,
    orderBy,
    keyword,
    page: Number(page),
    limit: Number(limit)
  });

  if (withCounts) {
    const [sales, counts] = await Promise.all([
      salesPromise,
      storeRepository.countFilters({
        grade: gradeFilter,
        genre: genreFilter,
        sale: saleFilterRaw,
        keyword
      })
    ]);
    return { sales, counts };
  }

  const sales = await salesPromise;
  return { sales };
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