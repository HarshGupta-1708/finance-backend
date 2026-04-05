import { Router } from 'express';
import * as categoriesController from './categories.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin, requireAnalystOrAdmin } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createCategorySchema,
  listCategoriesSchema,
  updateCategorySchema,
} from './categories.schema';

const router = Router();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags: [Categories]
 *     summary: List categories (analyst/admin)
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authenticate,
  requireAnalystOrAdmin,
  validate(listCategoriesSchema),
  categoriesController.listCategories,
);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a category (admin only)
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, requireAdmin, validate(createCategorySchema), categoriesController.createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   patch:
 *     tags: [Categories]
 *     summary: Update a category (admin only)
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', authenticate, requireAdmin, validate(updateCategorySchema), categoriesController.updateCategory);

export default router;
