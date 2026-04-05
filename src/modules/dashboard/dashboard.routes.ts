import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAnalystOrAdmin } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  categoryBreakdownSchema,
  dashboardSummarySchema,
  monthlyTrendsSchema,
  recentActivitySchema,
} from './dashboard.schema';

const router = Router();

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard summary
 *     security:
 *       - bearerAuth: []
 */
router.get('/summary', authenticate, validate(dashboardSummarySchema), dashboardController.getSummary);

/**
 * @swagger
 * /api/dashboard/categories:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get category breakdown
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/categories',
  authenticate,
  requireAnalystOrAdmin,
  validate(categoryBreakdownSchema),
  dashboardController.getCategoryBreakdown,
);

/**
 * @swagger
 * /api/dashboard/trends/monthly:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get monthly trends
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/trends/monthly',
  authenticate,
  requireAnalystOrAdmin,
  validate(monthlyTrendsSchema),
  dashboardController.getMonthlyTrends,
);

/**
 * @swagger
 * /api/dashboard/activity:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent activity
 *     security:
 *       - bearerAuth: []
 */
router.get('/activity', authenticate, validate(recentActivitySchema), dashboardController.getRecentActivity);

export default router;
