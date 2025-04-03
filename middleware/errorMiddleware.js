// errorMiddleware.js
const logErrors = (err, req, res, next) => {
    console.error('ERROR:', err.stack);
    next(err);
  };
  
  const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      status: 'error',
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  };
  
  module.exports = { logErrors, errorHandler };