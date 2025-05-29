export function getItemsPerPage(size) {
  switch (
    String(size).toLowerCase() // 소문자로 비교
  ) {
    case 'sm':
      return 16;
    case 'md':
      return 16;
    case 'lg':
      return 15;
    default:
      console.warn(
        `Invalid size: "${size}". Expected 'sm', 'md', or 'lg'. Defaulting to 16 items per page (md equivalent).`
      );
      return 16; // 'md' 사이즈에 해당하는 기본값
  }
}

export function calculatePaginationDetails({ totalItems, currentPage = 1, size = 'md' }) {
  if (typeof totalItems !== 'number' || totalItems < 0) {
    console.warn('calculatePaginationDetails: totalItems must be a non-negative number. Received:', totalItems);
    totalItems = 0; // 유효하지 않은 경우 0으로 처리
  }
  if (typeof currentPage !== 'number' || currentPage < 1) {
    currentPage = 1;
  }

  const itemsPerPage = getItemsPerPage(size);
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 0;

  if (totalPages > 0) {
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
  } else {
    // 아이템이 없거나 totalPages가 0이면 currentPage는 1로 설정
    currentPage = 1;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;

  // 아이템이 전혀 없는 경우에 대한 처리
  if (totalItems === 0) {
    return {
      totalItems: 0,
      currentPage: 1, // 아이템이 없어도 현재 페이지는 1로 표시
      itemsPerPage,
      totalPages: 0,
      startIndex: 0
    };
  }

  return {
    totalItems,
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex
  };
}
