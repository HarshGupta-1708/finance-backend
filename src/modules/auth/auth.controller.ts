import { NextFunction, Request, Response } from 'express';
import * as authService from './auth.service';
import { sendSuccess } from '../../utils/apiResponse';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, result, 'Registered successfully', 201);
  } catch (error) {
    return next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, 'Logged in successfully');
  } catch (error) {
    return next(error);
  }
};

export const bootstrapAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.bootstrapAdmin(req.body);
    return sendSuccess(res, result, 'Bootstrap admin created successfully', 201);
  } catch (error) {
    return next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getMe(req.user!.id);
    return sendSuccess(res, user);
  } catch (error) {
    return next(error);
  }
};
