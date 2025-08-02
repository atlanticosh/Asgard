const logger = require('../utils/logger');

/**
 * Global error handling middleware
 * This should be the last middleware in the chain
 */
function errorHandler(err, req, res, next) {
  // Log the error
  logger.error('Global error handler caught:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.requestId,
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.details || err.message;
  } else if (err.name === 'UnauthorizedError' || err.status === 401) {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError' || err.status === 403) {
    statusCode = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError' || err.status === 404) {
    statusCode = 404;
    message = 'Not Found';
  } else if (err.name === 'ConflictError' || err.status === 409) {
    statusCode = 409;
    message = 'Conflict';
  } else if (err.status) {
    statusCode = err.status;
    message = err.message || message;
  }

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  const errorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    path: req.path,
    method: req.method,
  };

  // Add additional details in development
  if (isDevelopment) {
    errorResponse.details = details || err.message;
    errorResponse.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Handle 404 errors (should be used before errorHandler)
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

/**
 * Async error wrapper to catch async errors in route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
