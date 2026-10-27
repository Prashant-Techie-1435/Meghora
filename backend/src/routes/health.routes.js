import { Router } from 'express';
import { getDatabaseStatus } from '../config/database.js';

const router = Router();

router.get('/health', (req, res) => {
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    status: 'healthy',
    service: 'Mausam Personalized API',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: {
      status: dbStatus.status,
      readyState: dbStatus.readyState,
      state: dbStatus.state,
      databaseName: dbStatus.databaseName,
      message: dbStatus.status === 'connected'
        ? 'MongoDB is healthy and connected'
        : 'MongoDB is disconnected or unavailable',
    },
    version: '1.0.0',
  });
});

export default router;
