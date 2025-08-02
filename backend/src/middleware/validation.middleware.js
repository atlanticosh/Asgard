const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Middleware to handle validation errors
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', {
      errors: errors.array(),
      path: req.path,
      method: req.method,
      requestId: req.requestId,
    });

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

/**
 * Bridge request validation
 */
const validateBridgeRequest = [
  body('fromChain')
    .isIn(['ethereum', 'stellar'])
    .withMessage('fromChain must be either "ethereum" or "stellar"'),

  body('toChain')
    .isIn(['ethereum', 'stellar'])
    .withMessage('toChain must be either "ethereum" or "stellar"'),

  body('tokenIn')
    .isString()
    .isLength({ min: 1 })
    .withMessage('tokenIn is required'),

  body('tokenOut')
    .isString()
    .isLength({ min: 1 })
    .withMessage('tokenOut is required'),

  body('amount')
    .isNumeric()
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Amount must be positive');
      }
      if (parseFloat(value) > 1000000) {
        throw new Error('Amount too large (max: 1,000,000)');
      }
      return true;
    }),

  body('userAddress')
    .isString()
    .isLength({ min: 20 })
    .withMessage('Valid user address is required'),

  handleValidationErrors,
];

/**
 * Quote request validation
 */
const validateQuoteRequest = [
  body('fromChain')
    .isIn(['ethereum', 'stellar'])
    .withMessage('fromChain must be either "ethereum" or "stellar"'),

  body('toChain')
    .isIn(['ethereum', 'stellar'])
    .withMessage('toChain must be either "ethereum" or "stellar"'),

  body('tokenIn')
    .isString()
    .isLength({ min: 1 })
    .withMessage('tokenIn is required'),

  body('tokenOut')
    .isString()
    .isLength({ min: 1 })
    .withMessage('tokenOut is required'),

  body('amount')
    .isNumeric()
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Amount must be positive');
      }
      return true;
    }),

  handleValidationErrors,
];

/**
 * Swap ID parameter validation
 */
const validateSwapId = [
  param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Valid swap ID is required'),

  handleValidationErrors,
];

/**
 * Achievement request validation
 */
const validateAchievementRequest = [
  body('achievementId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('achievementId is required'),

  handleValidationErrors,
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset must be non-negative'),

  handleValidationErrors,
];

/**
 * Ethereum address validation
 */
const validateEthereumAddress = (field) => [
  body(field)
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage(`${field} must be a valid Ethereum address`),
];

/**
 * Stellar address validation
 */
const validateStellarAddress = (field) => [
  body(field)
    .matches(/^G[A-Z0-9]{55}$/)
    .withMessage(`${field} must be a valid Stellar address`),
];

module.exports = {
  handleValidationErrors,
  validateBridgeRequest,
  validateQuoteRequest,
  validateSwapId,
  validateAchievementRequest,
  validatePagination,
  validateEthereumAddress,
  validateStellarAddress,
};
