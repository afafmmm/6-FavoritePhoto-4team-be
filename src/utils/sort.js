/**
repository에서 DB 자료 불러올 때:

async function getAll(query = {}) {
	const orderBy = getSort(query.orderBy) // (model, query)
	...
	
	const cards = await prisma.photoCard.findMany({ orderBy, ... })
*/

export default function getSort(model, order = "낮은 가격순") {
  const modelType = {
    photoCard: {
      "낮은 가격순": { initialPrice: "asc" },
      "높은 가격순": { initialPrice: "desc" },
      최신순: { createdAt: "desc" },
    },
    userCard: {
      "낮은 가격순": { price: "asc" },
      "높은 가격순": { price: "desc" },
      최신순: { createdAt: "desc" },
    },
  };

  const sort = modelType[model];

  if (!sort) throw new Error("'PhotoCard'와 'UserCard' 中 택1");

  if (!sort[order])
    throw new Error("'최신순', '높은 가격순', '낮은 가격순' 中 택1");

  return sort[order];
}
