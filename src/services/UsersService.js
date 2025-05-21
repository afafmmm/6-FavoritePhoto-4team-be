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

const usersService = { getCardMetaData, create };

export default usersService;
