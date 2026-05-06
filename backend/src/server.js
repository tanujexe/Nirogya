const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const logger = require('./utils/logger');
const setupAmbulanceSocket = require('./sockets/ambulanceSocket');

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    // ── Socket.IO setup ────────────────────────────────────────────────────
    const io = new Server(server, {
      cors: {
        origin: env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Make io available inside controllers via req.app.get('io')
    app.set('io', io);

    // Register socket namespaces / handlers
    setupAmbulanceSocket(io);

    server.listen(env.PORT, () => {
      logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      logger.info(`Socket.IO ready`);
    });

    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });

  } catch (error) {
    logger.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
