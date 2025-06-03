export default function getSort(model, order = '낮은 가격순') {
  const modelType = {
    initialCard: {
      '낮은 가격순': { initialPrice: 'asc' },
      '높은 가격순': { initialPrice: 'desc' },
      최신순: { createdAt: 'desc' }
    },
    card: {
      '낮은 가격순': { price: 'asc' },
      '높은 가격순': { price: 'desc' },
      최신순: { createdAt: 'desc' }
    }
  };

  const sort = modelType[model];

  if (!sort) throw new Error("'initialCard'와 'card' 中 택1");

  if (!sort[order]) throw new Error("'최신순', '높은 가격순', '낮은 가격순' 中 택1");

  return sort[order];
}
