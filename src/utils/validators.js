// 카드 생성
export function validatePostCard(data) {
  const errors = {};

  if (!data.name) {
    errors.name = "카드 이름을 입력해 주세요.";
  } else if (data.name.length > 10) {
    errors.name = "10자 이내로 입력해 주세요.";
  }

  if (!data.grade) errors.grade = "등급을 선택해 주세요.";
  if (!data.genre) errors.genre = "장르를 선택해 주세요.";

  if (!data.price) {
    errors.price = "가격을 입력해 주세요.";
  } else if (!/^\d+$/.test(data.price)) {
    errors.price = "가격은 숫자만 입력해 주세요.";
  }

  if (!data.volumn) {
    errors.volumn = "총 발행량을 입력해 주세요.";
  } else if (!/^\d+$/.test(data.volumn)) {
    errors.volumn = "발행량은 숫자만 입력해 주세요.";
  } else if (parseInt(data.volumn, 10) > 10) {
    errors.volumn = "발행량은 10장 이하만 가능합니다.";
  }

  if (!data.image) {
    errors.image = "이미지를 업로드해 주세요.";
  }

  if (data.description?.length > 60) {
    errors.description = "설명은 60자 이내로 입력해 주세요.";
  }

  return errors;
}
