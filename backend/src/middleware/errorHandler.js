const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose CastError
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with id of ${err.value}`;
  }

  // Handle Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}.`;
  }

  // Handle Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
