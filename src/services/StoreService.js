import storeRepository from '../repositories/StoreRepository.js';

async function getAllSalesWithDetails() {
  return await storeRepository.findAllSalesWithCounts();
}

async function getCardById(cardId) {
  return await storeRepository.findSaleCardById(cardId);
}

export default {
  getAllSalesWithDetails,
  getCardById,
};
