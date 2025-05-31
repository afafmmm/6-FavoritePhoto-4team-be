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

const getFilteredSalesWithCounts = async ({ grade, genre, sale, orderBy, keyword, withCounts = false }) => {
  const gradeFilter = parseFilterValue(grade);
  const genreFilter = parseFilterValue(genre);

  const saleFilterRaw = parseFilterValue(sale);
  const saleFilter = getStatusFilter(saleFilterRaw);
  console.log('saleFilter after getStatusFilter:', saleFilter);

  const salesPromise = storeRepository.findSalesByFilters({
    grade: gradeFilter,
    genre: genreFilter,
    sale: saleFilter,
    orderBy,
    keyword
  });

  if (withCounts) {
    const [sales, counts] = await Promise.all([
      salesPromise,
      storeRepository.countFilters()
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