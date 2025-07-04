export default function errorHandler(err, req, res, next) {
  const status = typeof err.code === "number" ? err.code : 500;

  return res.status(status).json({
    method: req.method,
    message: err.message || "서버 오류",
    data: err.data,
    errors: err.details || null, // FE에서 쓰라고 오류 전달
  });
}
