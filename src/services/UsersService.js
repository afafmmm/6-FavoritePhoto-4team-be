import usersRepository from "../repositories/UsersRepository.js";

// 카드 장르와 등급 불러오기
async function getCardMetaData() {
  const genres = await usersRepository.findGenre();
  const grades = await usersRepository.findGrade();
  return { genres, grades };
}

// POST
async function create(query) {
  const {
    name,
    grade,
    genre,
    description,
    volumn,
    price,
    imageFile,
    creatorId,
  } = query;

  if (
    !name ||
    !grade ||
    !genre ||
    !volumn ||
    !price ||
    !imageFile ||
    !creatorId
  ) {
    const error = new Error("카드 정보가 빠졌습니다.");
    error.code = 400;

    throw error;
  }

  return await usersRepository.create({
    name,
    grade,
    genre,
    description,
    volumn,
    price,
    imageFile,
    creatorId,
  });
}

const usersService = { getCardMetaData, create };

export default usersService;
