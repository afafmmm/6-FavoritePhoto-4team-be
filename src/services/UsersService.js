import UsersRepository from "../repositories/UsersRepository";

async function getCardMetaData() {
  const genres = await UsersRepository.findGenre();
  const grades = await UsersRepository.findGrade();
  return { genres, grades };
}

export default { getCardMetaData };
