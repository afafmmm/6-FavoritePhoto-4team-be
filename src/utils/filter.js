export function getGenreFilter(num) {
  const genreMap = {
    1: '풍경',
    2: '여행',
    3: '인물',
    4: '사물'
  };

  const genreName = genreMap[num];
  if (!genreName) throw new Error('genre는 1~4 사이의 값이어야 합니다.');

  return { name: genreName };
}

export function getGradeFilter(num) {
  const gradeMap = {
    1: 'COMMON',
    2: 'RARE',
    3: 'SUPER_RARE',
    4: 'LEGENDARY'
  };

  const gradeName = gradeMap[num];
  if (!gradeName) throw new Error('grade는 1~4 사이의 값이어야 합니다.');

  return { name: gradeName };
}

export const validStatuses = ['AVAILABLE', 'SOLDOUT'];

export function getStatusFilter(statuses) {
  if (!Array.isArray(statuses)) {
    statuses = [statuses];
  }
  statuses.forEach((status) => {
    if (!validStatuses.includes(status)) {
      throw new Error(`status는 ${validStatuses.join(', ')} 중 하나여야 합니다.`);
    }
  });
  return statuses;
}

export const cardStatuses = ['PENDING', 'AVAILABLE'];

export function getCardFilter(cardStatus) {
  if (!Array.isArray(cardStatus)) {
    cardStatus = [cardStatus];
  }
  cardStatus.forEach(status => {
    if (!cardStatuses.includes(status)) {
      throw new Error(`status는 ${cardStatuses.join(', ')} 중 하나여야 합니다.`);
    }
  });
  return cardStatus;
}
