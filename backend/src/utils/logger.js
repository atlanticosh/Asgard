const winston = require('winston');
const path = require('path');

// Define custom log levels and colors
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'grey',
  },
};

// Add colors to winston
winston.addColors(customLevels.colors);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return logMessage;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define transports
const transports = [
  // Console transport (for development)
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: consoleFormat,
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    level: 'info',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // File transport for error logs only
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Add HTTP request logging in development
if (process.env.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'debug.log'),
      level: 'debug',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  levels: customLevels.levels,
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true })
  ),
  transports,
  exitOnError: false,
});

// Add request ID context
logger.addRequestId = (requestId) => {
  return logger.child({ requestId });
};

// Helper methods for structured logging
logger.logSwapStart = (swapId, fromChain, toChain, amount) => {
  logger.info('Swap initiated', {
    swapId,
    fromChain,
    toChain,
    amount,
    event: 'swap_start',
  });
};

logger.logSwapComplete = (swapId, duration, txHash) => {
  logger.info('Swap completed', {
    swapId,
    duration,
    txHash,
    event: 'swap_complete',
  });
};

logger.logSwapError = (swapId, error, context = {}) => {
  logger.error('Swap failed', {
    swapId,
    error: error.message,
    stack: error.stack,
    ...context,
    event: 'swap_error',
  });
};

logger.logUserAction = (userId, action, metadata = {}) => {
  logger.info('User action', {
    userId,
    action,
    ...metadata,
    event: 'user_action',
  });
};

logger.logAPICall = (method, url, statusCode, duration, userId = null) => {
  logger.http('API call', {
    method,
    url,
    statusCode,
    duration,
    userId,
    event: 'api_call',
  });
};

logger.logBlockchainEvent = (
  chain,
  event,
  blockNumber,
  txHash,
  metadata = {}
) => {
  logger.info('Blockchain event', {
    chain,
    event,
    blockNumber,
    txHash,
    ...metadata,
    event: 'blockchain_event',
  });
};

logger.logGameAction = (userId, action, xpGained = 0, metadata = {}) => {
  logger.info('Game action', {
    userId,
    action,
    xpGained,
    ...metadata,
    event: 'game_action',
  });
};

logger.logAchievement = (userId, achievementId, xpReward) => {
  logger.info('Achievement unlocked', {
    userId,
    achievementId,
    xpReward,
    event: 'achievement_unlocked',
  });
};

logger.logSecurity = (event, ip, userAgent, metadata = {}) => {
  logger.warn('Security event', {
    event,
    ip,
    userAgent,
    ...metadata,
    event: 'security',
  });
};

logger.logPerformance = (operation, duration, metadata = {}) => {
  logger.verbose('Performance metric', {
    operation,
    duration,
    ...metadata,
    event: 'performance',
  });
};

logger.logExternalAPI = (
  service,
  operation,
  statusCode,
  duration,
  error = null
) => {
  const level = error ? 'error' : 'info';
  logger[level]('External API call', {
    service,
    operation,
    statusCode,
    duration,
    error: error?.message,
    event: 'external_api',
  });
};

// Handle uncaught exceptions and rejections
if (process.env.NODE_ENV === 'production') {
  logger.exceptions.handle(
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: fileFormat,
    })
  );

  logger.rejections.handle(
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: fileFormat,
    })
  );
}

// Log startup information
logger.info('Logger initialized', {
  level: logger.level,
  environment: process.env.NODE_ENV,
  timestamp: new Date().toISOString(),
});

module.exports = logger;
