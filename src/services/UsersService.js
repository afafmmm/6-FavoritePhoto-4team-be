import usersRepository from "../repositories/UsersRepository.js";

// 카드 장르와 등급 불러오기
async function getCardMetaData() {
  const genres = await usersRepository.findGenre();
  const grades = await usersRepository.findGrade();
  return { genres, grades };
}

// POST
async function create(query) {
  return await usersRepository.create(query);
}

// GET: My Gallery
async function getMyGallery(userId, query) {
  return await usersRepository.findMyGallery(userId, query);
}

// GET: 내 판매 카드
async function getMySales(userId, query) {
  return await usersRepository.findMySales(userId, query);
}

const usersService = { getCardMetaData, create, getMyGallery, getMySales };

export default usersService;
