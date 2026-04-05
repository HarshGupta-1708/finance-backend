import { NextFunction, Request, Response } from 'express';
import * as dashboardService from './dashboard.service';
import { sendSuccess } from '../../utils/apiResponse';

export const getSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    const data = await dashboardService.getSummary(
      req.user!.id,
      req.user!.role,
      startDate,
      endDate,
    );

    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getCategoryBreakdown = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    const data = await dashboardService.getCategoryBreakdown(
      req.user!.id,
      req.user!.role,
      startDate,
      endDate,
    );

    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getMonthlyTrends = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const year = req.query.year ? Number(req.query.year) : undefined;
    const data = await dashboardService.getMonthlyTrends(req.user!.id, req.user!.role, year);
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getRecentActivity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const data = await dashboardService.getRecentActivity(req.user!.id, req.user!.role, limit);
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
};
