import SalesRepository from '../repositories/SalesRepository.js';

async function createSale(data) {
  if (!Array.isArray(data.userCardIds) || data.userCardIds.length !== data.saleQuantity) {
    const error = new Error('선택한 카드 수와 판매 수량이 일치하지 않습니다.');
    error.code = 400;
    throw error;
  }

  return await SalesRepository.createSale(data);
}

async function cancelSale(userId, saleId) {
  return await SalesRepository.cancelSale(userId, saleId);
}

async function updateSale(userId, saleId, updateData) {
  return await SalesRepository.updateSale(userId, saleId, updateData);
}

export default { createSale, cancelSale, updateSale };
