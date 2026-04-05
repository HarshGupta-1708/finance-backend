import { Router } from 'express';
import * as recordsController from './records.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAnalystOrAdmin } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createRecordSchema,
  listRecordsSchema,
  recordIdParamSchema,
  updateRecordSchema,
} from './records.schema';

const router = Router();

/**
 * @swagger
 * /api/records:
 *   post:
 *     tags: [Records]
 *     summary: Create a financial record
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, requireAnalystOrAdmin, validate(createRecordSchema), recordsController.createRecord);

/**
 * @swagger
 * /api/records:
 *   get:
 *     tags: [Records]
 *     summary: List records with filtering and pagination
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, requireAnalystOrAdmin, validate(listRecordsSchema), recordsController.getRecords);

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     tags: [Records]
 *     summary: Get one record
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, requireAnalystOrAdmin, validate(recordIdParamSchema), recordsController.getRecordById);

/**
 * @swagger
 * /api/records/{id}:
 *   patch:
 *     tags: [Records]
 *     summary: Update a record
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', authenticate, requireAnalystOrAdmin, validate(updateRecordSchema), recordsController.updateRecord);

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     tags: [Records]
 *     summary: Soft-delete a record
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, requireAnalystOrAdmin, validate(recordIdParamSchema), recordsController.deleteRecord);

export default router;
