import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { buildPaginatedResult, getPaginationParams } from '../../utils/pagination';
import { AppError, NotFoundError } from '../../utils/errors';
import type { CreateUserInput } from './users.schema';

const getActiveAdminCount = () =>
  prisma.user.count({
    where: {
      role: Role.ADMIN,
      isActive: true,
      deletedAt: null,
    },
  });

export const createUser = async (input: CreateUserInput) => {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      isActive: input.isActive,
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
};

export const getAllUsers = async (page: number, limit: number, search?: string) => {
  const pagination = getPaginationParams(page, limit);

  const where = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              email: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.user.count({ where }),
  ]);

  return buildPaginatedResult(users, total, pagination.page, pagination.limit);
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
    },
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
    throw new NotFoundError('User');
  }

  return user;
};

export const updateUserRole = async (userId: string, role: Role) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
    },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  if (user.role === Role.ADMIN && role !== Role.ADMIN && user.isActive) {
    const activeAdminCount = await getActiveAdminCount();
    if (activeAdminCount <= 1) {
      throw new AppError('Cannot demote the last active admin', 400);
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });
};

export const toggleUserStatus = async (userId: string, requesterId: string) => {
  if (userId === requesterId) {
    throw new AppError('Cannot deactivate your own account', 400);
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
    },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  if (user.role === Role.ADMIN && user.isActive) {
    const activeAdminCount = await getActiveAdminCount();
    if (activeAdminCount <= 1) {
      throw new AppError('Cannot deactivate the last active admin', 400);
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      isActive: !user.isActive,
    },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
    },
  });
};

export const deleteUser = async (userId: string, requesterId: string) => {
  if (userId === requesterId) {
    throw new AppError('Cannot delete your own account', 400);
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
    },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  if (user.role === Role.ADMIN && user.isActive) {
    const activeAdminCount = await getActiveAdminCount();
    if (activeAdminCount <= 1) {
      throw new AppError('Cannot delete the last active admin', 400);
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });
};
