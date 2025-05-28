import SalesRepository from '../repositories/SalesRepository.js';

async function createSale(data) {
  if (!Array.isArray(data.userCardIds) || data.userCardIds.length < data.saleQuantity) {
    const error = new Error('선택한 카드 수가 판매 수량보다 적습니다.');
    error.code = 400;
    throw error;
  }

  // 정확히 필요한 수량만 사용
  const limitedUserCardIds = data.userCardIds.slice(0, data.saleQuantity);
  return await SalesRepository.createSale({ ...data, userCardIds: limitedUserCardIds });
}

async function cancelSale(userId, saleId) {
  return await SalesRepository.cancelSale(userId, saleId);
}

async function updateSale(userId, saleId, updateData) {
  return await SalesRepository.updateSale(userId, saleId, updateData);
}

export default { createSale, cancelSale, updateSale };
