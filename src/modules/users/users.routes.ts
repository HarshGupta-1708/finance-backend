import { Router } from 'express';
import * as usersController from './users.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createUserSchema,
  listUsersSchema,
  updateRoleSchema,
  userIdParamSchema,
} from './users.schema';

const router = Router();

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a user (admin only)
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, requireAdmin, validate(createUserSchema), usersController.createUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List users (admin only)
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, requireAdmin, validate(listUsersSchema), usersController.getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by id (admin only)
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, requireAdmin, validate(userIdParamSchema), usersController.getUserById);

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Update user role (admin only)
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/role', authenticate, requireAdmin, validate(updateRoleSchema), usersController.updateUserRole);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Toggle user status (admin only)
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/status', authenticate, requireAdmin, validate(userIdParamSchema), usersController.toggleUserStatus);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Soft-delete user (admin only)
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, requireAdmin, validate(userIdParamSchema), usersController.deleteUser);

export default router;
