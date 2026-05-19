function errorHandler(error, req, res, next) {
  const statusCode = res.statusCode === 200 ? error.statusCode || 500 : res.statusCode;

  res.status(statusCode).json({
    message: error.message || 'Server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
  });
}

export default errorHandler;
