import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import * as usersService from './users.service';
import { sendSuccess } from '../../utils/apiResponse';

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await usersService.createUser(req.body);
    return sendSuccess(res, user, 'User created successfully', 201);
  } catch (error) {
    return next(error);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const result = await usersService.getAllUsers(page, limit, search);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await usersService.getUserById(req.params.id);
    return sendSuccess(res, user);
  } catch (error) {
    return next(error);
  }
};

export const updateUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await usersService.updateUserRole(req.params.id, req.body.role as Role);
    return sendSuccess(res, user, 'User role updated');
  } catch (error) {
    return next(error);
  }
};

export const toggleUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await usersService.toggleUserStatus(req.params.id, req.user!.id);
    return sendSuccess(res, user, 'User status updated');
  } catch (error) {
    return next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await usersService.deleteUser(req.params.id, req.user!.id);
    return sendSuccess(res, null, 'User deleted');
  } catch (error) {
    return next(error);
  }
};
