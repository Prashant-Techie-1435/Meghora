/**
 * Centralized error handler middleware.
 * Ensures consistent JSON error responses and handles Mongoose/database errors gracefully.
 */
export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose connection & server selection errors
  if (
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongooseServerSelectionError' ||
    (err.name === 'MongooseError' && (err.message.includes('buffering timed out') || err.message.includes('Client must be connected')))
  ) {
    statusCode = 503;
    message = 'MongoDB database is currently offline or unreachable. Please verify that your local MongoDB server is running or MONGODB_URI is configured correctly.';
  }

  // Handle Mongoose schema validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // Handle MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    message = 'A record with this unique identifier or city already exists.';
  }

  // Log server errors for inspection
  if (statusCode >= 500) {
    console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, err.message);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      status: statusCode,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
};

export default errorHandler;
