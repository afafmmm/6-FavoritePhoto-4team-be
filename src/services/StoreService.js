import storeRepository from "../repositories/StoreRepository.js";

async function getAllCardsWithCounts() {
  const cards = await storeRepository.findAllCards();
  const gradeCounts = await storeRepository.countCardsByGrade();
  const genreCounts = await storeRepository.countCardsByGenre();
  const saleCounts = await storeRepository.countCardsBySaleStatus();

  return { cards, gradeCounts, genreCounts, saleCounts };
}

async function getCardById(id) {
  return await storeRepository.findCardById(id);
}

export default {
  getAllCardsWithCounts,
  getCardById,
};
