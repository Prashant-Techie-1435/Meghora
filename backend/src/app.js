import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/health.routes.js';
import weatherRoutes from './routes/weather.routes.js';
import homepageRoutes from './routes/homepage.routes.js';
import preferencesRoutes from './routes/preferences.routes.js';
import locationsRoutes from './routes/locations.routes.js';
import alertsRoutes from './routes/alerts.routes.js';

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for academic presentation & demo cross-origins
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Request logger for inspection
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// API Routes
app.use('/api', healthRoutes);
app.use('/api', weatherRoutes);
app.use('/api', homepageRoutes);
app.use('/api', preferencesRoutes);
app.use('/api', locationsRoutes);
app.use('/api', alertsRoutes);

// Root informative endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Mausam Personalized Backend API',
    sih_problem: 'SIH26076: Development of personalized homepage for Mausam mobile application',
    organization: 'Ministry of Earth Sciences (MoES)',
    status: 'online',
    endpoints: {
      health: '/api/health',
      weather: '/api/weather?city=Mumbai',
      homepage: '/api/homepage?city=Mumbai&userId=demo-user',
      preferences: '/api/preferences/demo-user',
      locations: '/api/locations/demo-user',
      alerts: '/api/alerts?city=Mumbai',
    },
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint ${req.method} ${req.originalUrl} not found.`,
      status: 404,
    },
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
