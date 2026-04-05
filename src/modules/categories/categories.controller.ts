import { NextFunction, Request, Response } from 'express';
import * as categoriesService from './categories.service';
import { sendSuccess } from '../../utils/apiResponse';

export const listCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const categories = await categoriesService.listCategories(req.query as any);
    return sendSuccess(res, categories);
  } catch (error) {
    return next(error);
  }
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const category = await categoriesService.createCategory(req.body);
    return sendSuccess(res, category, 'Category created', 201);
  } catch (error) {
    return next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const category = await categoriesService.updateCategory(Number(req.params.id), req.body);
    return sendSuccess(res, category, 'Category updated');
  } catch (error) {
    return next(error);
  }
};
