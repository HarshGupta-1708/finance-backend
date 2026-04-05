import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError } from '../utils/errors';

export const requireRole = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError());
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`Requires one of roles: ${roles.join(', ')}`),
      );
    }

    return next();
  };
};

export const requireAdmin = requireRole(Role.ADMIN);
export const requireAnalystOrAdmin = requireRole(Role.ANALYST, Role.ADMIN);
