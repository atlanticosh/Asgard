require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const rateLimit = require('express-rate-limit');

// Import utilities and config
const logger = require('./utils/logger');
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');

// Import routes
const {
  router: bridgeRoutes,
  setEthereumService: setBridgeEthereumService,
} = require('./routes/bridge.routes');
const userRoutes = require('./routes/user.routes');
const gameRoutes = require('./routes/game.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const {
  router: healthRoutes,
  setEthereumService,
  setStellarService,
} = require('./routes/health.routes');
const {
  router: stellarRoutes,
  setStellarService: setStellarServiceForRoutes,
} = require('./routes/stellar.routes');

// Import middleware
const {
  errorHandler,
  notFoundHandler,
} = require('./middleware/error.middleware');
const { authenticateToken } = require('./middleware/auth.middleware');

// Import services
const WebSocketService = require('./services/websocket.service');
const MonitoringService = require('./services/monitoring.service');
const EthereumService = require('./services/ethereum.service');
const StellarService = require('./services/stellar.service');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:3001',
    methods: ['GET', 'POST'],
  },
});

// Initialize services
const webSocketService = new WebSocketService(io);
const monitoringService = new MonitoringService();
const ethereumService = new EthereumService();
const stellarService = new StellarService();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3001',
      'http://localhost:3000',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Rate limiting (more permissive in development)
const isProduction = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW_MS) ||
    (isProduction ? 15 * 60 * 1000 : 60 * 1000), // 15 min in prod, 1 min in dev
  max:
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) ||
    (isProduction ? 100 : 1000), // 100 in prod, 1000 in dev
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(
      (parseInt(process.env.RATE_LIMIT_WINDOW_MS) ||
        (isProduction ? 15 * 60 * 1000 : 60 * 1000)) / 1000
    ),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Add request ID for tracking
app.use((req, res, next) => {
  req.requestId = Math.random().toString(36).substring(2, 15);
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Health check endpoint (no auth required)
app.use('/health', healthRoutes);

// API routes
app.use('/api/bridge', bridgeRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/game', authenticateToken, gameRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/stellar', stellarRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`New WebSocket connection: ${socket.id}`);
  webSocketService.handleConnection(socket);
});

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close database connections
      await require('./config/database').closeDatabase();
      logger.info('Database connections closed');

      // Close Redis connection
      await require('./config/redis').closeRedis();
      logger.info('Redis connection closed');

      // Stop monitoring services
      await monitoringService.stop();
      logger.info('Monitoring services stopped');

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Initialize and start server
async function startServer() {
  try {
    logger.info('Starting Stellar-Ethereum Bridge Backend...');

    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Initialize Ethereum service
    await ethereumService.initialize();
    logger.info('Ethereum service initialized successfully');

    // Initialize Stellar service
    await stellarService.initialize();
    logger.info('Stellar service initialized successfully');

    // Inject services into routes
    setEthereumService(ethereumService);
    setBridgeEthereumService(ethereumService);
    setStellarService(stellarService);
    setStellarServiceForRoutes(stellarService);

    // Start monitoring services
    await monitoringService.start();
    logger.info('Monitoring services started');

    // Start the server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🌟 Environment: ${process.env.NODE_ENV}`);
      logger.info(
        `📊 Health check available at: http://localhost:${PORT}/health`
      );
      logger.info(
        `🎮 Game features: ${
          process.env.ENABLE_GAME_FEATURES === 'true' ? 'ENABLED' : 'DISABLED'
        }`
      );
      logger.info(`🔗 WebSocket server ready for connections`);

      if (process.env.NODE_ENV === 'development') {
        logger.info(`📝 API Documentation: http://localhost:${PORT}/api/docs`);
      }
    });

    // Auto-deploy contracts if enabled
    if (process.env.AUTO_DEPLOY_CONTRACTS === 'true') {
      logger.info('Auto-deploying smart contracts...');
      const { deployContracts } = require('./scripts/deploy-contracts');
      await deployContracts();
    }

    // Seed database if enabled
    if (process.env.SEED_DATABASE === 'true') {
      logger.info('Seeding database with sample data...');
      const { seedDatabase } = require('./scripts/seed');
      await seedDatabase();
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export for testing
module.exports = { app, server, ethereumService, stellarService };

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}
