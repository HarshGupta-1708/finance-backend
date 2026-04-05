import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { generalLimiter } from './middlewares/rateLimiter.middleware';

import authRoutes from './modules/auth/auth.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import recordsRoutes from './modules/records/records.routes';
import usersRoutes from './modules/users/users.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('combined'));
app.use(generalLimiter);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// Root route - API info
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Finance Dashboard API',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      documentation: '/api/docs',
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      records: '/api/records',
      categories: '/api/categories',
      dashboard: '/api/dashboard',
    },
    features: [
      'User & Role Management (VIEWER, ANALYST, ADMIN)',
      'Financial Records CRUD with Soft Delete',
      'Dashboard Analytics & Reports',
      'JWT Authentication (7-day tokens)',
      'Rate Limiting (Redis-backed)',
      'Pagination & Search',
      'Role-Based Access Control',
    ],
    database: 'PostgreSQL (Neon)',
    cache: 'Redis',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    service: 'Finance Dashboard API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    hint: 'Visit / for API info or /api/docs for Swagger documentation',
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

export default app;
