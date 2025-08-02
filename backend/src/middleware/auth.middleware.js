const logger = require('../utils/logger');

/**
 * Authentication middleware - STUB VERSION
 * TODO: Implement proper JWT authentication
 */
function authenticateToken(req, res, next) {
  try {
    // For now, just log and pass through
    logger.debug(
      'Auth middleware called - STUB VERSION (allowing all requests)',
      {
        path: req.path,
        method: req.method,
      }
    );

    // TODO: Implement actual JWT token verification
    // const authHeader = req.headers['authorization'];
    // const token = authHeader && authHeader.split(' ')[1];

    // For development, create a fake user
    req.user = {
      id: 'stub-user-id',
      ethereumAddress: '0x742d35Cc57C5e3b4A3e4e5F1234567890abcdef12',
      stellarAddress: 'GABC123456789DEFGHIJKLMNOPQRSTUVWXYZ',
      username: 'dev_user',
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Auth middleware error - this is a stub implementation',
    });
  }
}

/**
 * Optional authentication middleware - for public endpoints
 */
function optionalAuth(req, res, next) {
  try {
    // Similar to authenticateToken but doesn't fail if no token
    req.user = {
      id: 'anonymous-user',
      ethereumAddress: null,
      stellarAddress: null,
      username: 'anonymous',
    };

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // Continue anyway for optional auth
  }
}

module.exports = {
  authenticateToken,
  optionalAuth,
};
