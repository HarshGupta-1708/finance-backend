import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../../src/config/database';
import * as usersService from '../../src/modules/users/users.service';
import { AppError } from '../../src/utils/errors';

jest.mock('../../src/config/database', () => ({
  prisma: {
    user: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

describe('Users Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createUser should create a user with hashed password', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user-1',
      name: 'Admin Created User',
      email: 'created@test.com',
      role: Role.ANALYST,
      isActive: true,
      createdAt: new Date(),
    });

    const result = await usersService.createUser({
      name: 'Admin Created User',
      email: 'created@test.com',
      password: 'password123',
      role: Role.ANALYST,
      isActive: true,
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    expect(result.role).toBe(Role.ANALYST);
  });

  it('updateUserRole should prevent demoting the last active admin', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      role: Role.ADMIN,
      isActive: true,
      deletedAt: null,
    });
    (prisma.user.count as jest.Mock).mockResolvedValue(1);

    await expect(
      usersService.updateUserRole('admin-1', Role.ANALYST),
    ).rejects.toBeInstanceOf(AppError);
  });
});
