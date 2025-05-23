import usersRepository from "../repositories/UsersRepository.js";

// 카드 장르와 등급 불러오기
async function getCardMetaData() {
  const genres = await usersRepository.findGenre();
  const grades = await usersRepository.findGrade();
  return { genres, grades };
}

// 카드 생성 횟수 불러오기
async function getCardCreationCount(userId) {
  return await usersRepository.getMonthlyCardCount(userId);
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

// GET: 사용자 1人
async function getUser(id) {
  const user = await usersRepository.findById(id);

  if (!user) {
    const error = new Error("해당 사용자를 찾을 수 없습니다.");
    error.code = 404;
    throw error;
  }

  return user;
}

const usersService = {
  getCardMetaData,
  create,
  getMyGallery,
  getMySales,
  getUser,
  getCardCreationCount,
};

export default usersService;
