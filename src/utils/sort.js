/**
repository에서 DB 자료 불러올 때:

async function getAll(query = {}) {
	const orderBy = getSort(query.orderBy)
	...
	
	const cards = await prisma.photoCard.findMany({ orderBy, ... })
*/

export default function getSort(order) {
  const options = ["최신순", "높은 가격순", "낮은 가격순"];

  if (!options.includes(order)) {
    throw new Error("최신순, 높은 가격순, 낮은 가격순 中 택1");
  }

  switch (order) {
    case "최신순":
      return { createdAt: "desc" };
    case "높은 가격순":
      return { price: "desc" };
    case "낮은 가격순":
      return { price: "asc" };
    default:
      return { price: "asc" };
  }
}
