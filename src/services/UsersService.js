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
  // 1. 쿼리 문자열 검증
  const genreId = query.genreId ? Number(query.genreId) : null;
  const gradeId = query.gradeId ? Number(query.gradeId) : null;
  const search = query.search || null;
  const page = query.page ? Math.max(1, parseInt(query.page, 10)) : 1;
  const size = query.size || 'md';

  const tempPagination = calculatePaginationDetails({
    totalItems: 0, // 임시 값
    currentPage: page,
    size
  });

  // 2. 대충 오류 처리
  if (genreId && (genreId < 1 || genreId > 4)) {
    const error = new Error('장르 ID는 1~4 사이의 값이어야 합니다.');
    error.code = 400;
    throw error;
  }

  // 3. 데이터 조회
  const { totalItems, items } = await usersRepository.findMyGallery(userId, {
    genreId,
    gradeId,
    search,
    offset: tempPagination.startIndex,
    limit: tempPagination.itemsPerPage
  });

  // 4. 진짜 페이지네이션 갱신
  const pagination = calculatePaginationDetails({
    totalItems,
    currentPage: page,
    size
  });

  return { items, pagination };
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
