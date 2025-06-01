import usersRepository from '../repositories/UsersRepository.js';
import { calculatePaginationDetails, getItemsPerPage } from '../utils/pagination.js';

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
  const genre = query.genre ? Number(query.genre) : null;
  const grade = query.grade ? Number(query.grade) : null;
  const keyword = query.keyword || null;
  const page = query.page ? Math.max(1, parseInt(query.page, 10)) : 1;
  const size = query.size || 'md';
  const withCounts = true; // 우주: counts 요청 여부

  // 2. 대충 오류 처리
  if (genre && (genre < 1 || genre > 4)) {
    const error = new Error('장르 ID는 1~4 사이의 값이어야 합니다.');
    error.code = 400;
    throw error;
  }

  // 3. 페이지 계산
  const itemsPerPage = getItemsPerPage(size);
  const offset = (page - 1) * itemsPerPage;

  // 4. 데이터 조회
  const galleryPromise = usersRepository.findMyGallery(userId, {
    genre,
    grade,
    keyword,
    offset,
    limit: itemsPerPage
  });

  if (withCounts) {
    const [gallery, counts] = await Promise.all([
      galleryPromise,
      usersRepository.countGalleryFilters(userId, { genre, grade, keyword }) // 우주: 필터 카운트 병렬 조회
    ]);

    // 5. 페이지네이션 갱신
    const pagination = calculatePaginationDetails({
      totalItems: gallery.totalItems,
      currentPage: page,
      size
    });

    return {
      items: gallery.items,
      pagination,
      counts // 우주: 프론트에서 필터 갯수 렌더링할 수 있도록 추가
    };
  } else {
    const gallery = await galleryPromise;

    // 5. 페이지네이션 갱신
    const pagination = calculatePaginationDetails({
      totalItems: gallery.totalItems,
      currentPage: page,
      size
    });

    return {
      items: gallery.items,
      pagination
    };
  }
}

// GET: 내 판매 카드
async function getMySales(userId, query) {
  // 1. 쿼리 문자열 검증
  const genre = query.genre ? Number(query.genre) : null;
  const grade = query.grade ? Number(query.grade) : null;
  const keyword = query.keyword || null;
  const saleType = query.saleType || null;
  const saleStatus = query.saleStatus || null;
  const page = query.page ? Math.max(1, parseInt(query.page, 10)) : 1;
  const size = query.size || 'md';

  // 2. 검증
  if (genre && (genre < 1 || genre > 4)) {
    const error = new Error('장르 ID는 1~4 사이의 값이어야 합니다.');
    error.code = 400;
    throw error;
  }

  // 3. 페이지 계산
  const itemsPerPage = getItemsPerPage(size);
  const offset = (page - 1) * itemsPerPage;

  // 4. 데이터 조회
  const { totalItems, items } = await usersRepository.findMySales(userId, {
    genre,
    grade,
    keyword,
    saleType,
    saleStatus,
    offset: offset,
    limit: itemsPerPage
  });

  // 5. 페이지네이션 갱신
  const pagination = calculatePaginationDetails({
    totalItems,
    currentPage: page,
    size
  });

  return { items, pagination };
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

//--특정 유저의 포토카드 상세 (우주)
async function getUserPhotoCardDetail(userId, photoCardId) {
  return await usersRepository.getUserPhotoCardDetail(userId, photoCardId);
}

const usersService = {
  getCardMetaData,
  create,
  getMyGallery,
  getMySales,
  getUser,
  getCardCreationCount,
  getCardsCount,
  getUserPhotoCardDetail
};

export default usersService;
