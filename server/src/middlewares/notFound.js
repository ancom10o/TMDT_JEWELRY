function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Khong tim thay API: ${req.originalUrl}`));
}

export default notFound;
