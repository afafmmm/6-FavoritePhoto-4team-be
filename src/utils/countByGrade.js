export default function countCardsByGrade(cards) {
  // 등급별로 카드 개수를 셀 건데
  const result = {
    // 그 결과는 다음과 같음
    total: 0,
    byGrade: {}
  };

  for (let card of cards) {
    // 반복문으로 셀 거고
    const gradeId = card.gradeId; // 1. 등급 id 추출
    result.total += 1; // 2. 전체 개수 +
    result.byGrade[gradeId] = (result.byGrade[gradeId] || 0) + 1; // 3. 해당 등급 +1. 없으면 0에서 시작
  }

  return result;
}
