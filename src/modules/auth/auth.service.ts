import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { AppError, UnauthorizedError } from '../../utils/errors';
import type { LoginInput, RegisterInput } from './auth.schema';

const generateToken = (user: { id: string; email: string; role: Role }) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError('JWT secret is not configured', 500);
  }

  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
  };

  return jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, options);
};

export const register = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const token = generateToken(user);
  return { user, token };
};

export const bootstrapAdmin = async (input: RegisterInput) => {
  const existingActiveAdminCount = await prisma.user.count({
    where: {
      role: Role.ADMIN,
      isActive: true,
      deletedAt: null,
    },
  });

  if (existingActiveAdminCount > 0) {
    throw new AppError('An active admin already exists', 409);
  }

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: Role.ADMIN,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  const token = generateToken(user);
  return { user, token };
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.isActive || user.deletedAt) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const token = generateToken(user);
  const { passwordHash: _passwordHash, ...safeUser } = user;

  return { user: safeUser, token };
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('Account not found');
  }

  return user;
};
