require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { seedAdmin } = require('./utils/seeder');
const { initSocket } = require('./socket');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Create HTTP server so Socket.io can attach to it
  const server = http.createServer(app);

  // Initialize Socket.io
  initSocket(server);

  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    logger.info(`📚 API Docs: http://localhost:${PORT}/api/v1/docs`);
    logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
  });

  // Connect to Database asynchronously to allow cloud health checks to succeed immediately
  connectDB().then((connected) => {
    if (connected) {
      seedAdmin().catch((err) => logger.warn('Seed admin skipped:', err.message));
    }
  }).catch((err) => {
    logger.warn('Initial database connection attempt deferred:', err.message);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', err);
    server.close(() => process.exit(1));
  });
};

startServer();
