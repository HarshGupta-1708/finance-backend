import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../config/database';
import { UnauthorizedError } from '../utils/errors';

interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return next(new UnauthorizedError('JWT secret is not configured'));
  }

  let payload: JwtPayload;

  try {
    payload = jwt.verify(token, secret) as JwtPayload;
  } catch {
    return next(new UnauthorizedError('Invalid or expired token'));
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        id: payload.id,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return next(new UnauthorizedError('Account is inactive or not found'));
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    return next();
  } catch (error) {
    return next(error);
  }
};
