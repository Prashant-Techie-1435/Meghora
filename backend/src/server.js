import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory if present, else fallback to cwd
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { seedInitialData } from './config/seed.js';

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

let server;

async function startServer() {
  try {
    // 1. Initialize MongoDB connection
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meghora';
    try {
      await connectDatabase(mongoUri);
      await seedInitialData();
    } catch (dbErr) {
      console.warn(`[Database Warning] Could not connect to MongoDB (${dbErr.message}).`);
      console.warn('👉 Ensure your local MongoDB is running (e.g. `mongod`) or configure MONGODB_URI in backend/.env for MongoDB Atlas.');
    }

    // 2. Start HTTP Express Server
    server = app.listen(PORT, HOST, () => {
      console.log('====================================================');
      console.log(`🌤️  Meghora MERN Weather Backend API Server Running`);
      console.log(`📍 Listening on: http://localhost:${PORT}`);
      console.log(`🛡️  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📑 Homepage API: http://localhost:${PORT}/api/homepage?city=Mumbai`);
      console.log('====================================================');
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ [Port Conflict] Port ${PORT} is already in use by another process.`);
        console.error(`👉 Run 'npx kill-port ${PORT}' or terminate the existing process, then restart.\n`);
      } else {
        console.error('[Server Error]:', err);
      }
    });
  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
}

// Graceful shutdown handling
const shutdown = async (signal) => {
  console.log(`\n[${signal}] Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP connections closed.');
      await disconnectDatabase();
      console.log('[Server] Process terminated safely.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
