import usersRepository from '../repositories/UsersRepository.js';
import { calculatePaginationDetails } from '../utils/pagination.js';

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
  const { genreId, gradeId, search, page, size } = query;

  // 1. 필터 조건에 맞는 전체 아이템 개수 조회
  const totalItems = await usersRepository.countMyGallery(userId, {
    genreId,
    gradeId,
    search
  });

  // 2. 페이지네이션 상세 정보 계산
  const currentPage = page ? parseInt(page, 10) : 1;
  const paginationDetails = calculatePaginationDetails({
    totalItems,
    currentPage: currentPage,
    size: size // calculatePaginationDetails에서 size 기본값 처리
  });

  // 3. 현재 페이지에 해당하는 데이터 조회
  const items = await usersRepository.findMyGallery(userId, {
    genreId,
    gradeId,
    search,
    offset: paginationDetails.startIndex,
    limit: paginationDetails.itemsPerPage
  });

  return {
    items,
    pagination: paginationDetails
  };
}

// GET: 내 판매 카드
async function getMySales(userId, query) {
  const { genreId, gradeId, search, saleType, soldOut, page, size } = query;

  const totalItems = await usersRepository.countMySales(userId, {
    genreId,
    gradeId,
    search,
    saleType,
    soldOut
  });

  const currentPage = page ? parseInt(page, 10) : 1;
  const paginationDetails = calculatePaginationDetails({
    totalItems,
    currentPage: currentPage,
    size: size
  });

  const items = await usersRepository.findMySales(userId, {
    genreId,
    gradeId,
    search,
    saleType,
    soldOut,
    offset: paginationDetails.startIndex,
    limit: paginationDetails.itemsPerPage
  });

  return {
    items,
    pagination: paginationDetails
  };
}

// GET: 사용자 1人
async function getUser(id) {
  const user = await usersRepository.findById(id);

  if (!user) {
    const error = new Error('해당 사용자를 찾을 수 없습니다.');
    error.code = 404;
    throw error;
  }

  return user;
}

// GET: 카드 개수 (전체 + 등급)
async function getCardsCount(userId) {
  return await usersRepository.getCardsCount(userId);
}

const usersService = {
  getCardMetaData,
  create,
  getMyGallery,
  getMySales,
  getUser,
  getCardCreationCount,
  getCardsCount
};

export default usersService;
