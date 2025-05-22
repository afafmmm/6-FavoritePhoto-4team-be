import storeRepository from "../repositories/StoreRepository.js";

// GET: 전체 포토카드 목록 조회
async function getAllCards() {
  return await storeRepository.findAllCards();
}

// GET: 특정 포토카드 상세 조회
async function getCardById(id) {
  return await storeRepository.findCardById(id);
}

// 서비스 객체로 내보내기
export default { getAllCards, getCardById };
