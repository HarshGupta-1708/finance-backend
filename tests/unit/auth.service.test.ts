import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../../src/config/database';
import * as authService from '../../src/modules/auth/auth.service';

jest.mock('../../src/config/database', () => ({
  prisma: {
    user: {
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret_key_at_least_32_characters';
  });

  it('register should create a new user and return token', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user-1',
      name: 'User',
      email: 'user@test.com',
      role: Role.VIEWER,
      createdAt: new Date(),
    });
    (jwt.sign as jest.Mock).mockReturnValue('jwt_token');

    const result = await authService.register({
      name: 'User',
      email: 'user@test.com',
      password: 'password123',
    });

    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    expect(result.token).toBe('jwt_token');
    expect(result.user.email).toBe('user@test.com');
  });

  it('login should return user and token for valid credentials', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      name: 'User',
      email: 'user@test.com',
      role: Role.ANALYST,
      passwordHash: 'hashed_password',
      isActive: true,
      deletedAt: null,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('jwt_token');

    const result = await authService.login({
      email: 'user@test.com',
      password: 'password123',
    });

    expect(result.token).toBe('jwt_token');
    expect(result.user.email).toBe('user@test.com');
  });

  it('bootstrapAdmin should create the first admin when none exists', async () => {
    (prisma.user.count as jest.Mock).mockResolvedValue(0);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      name: 'Bootstrap Admin',
      email: 'bootstrap@test.com',
      role: Role.ADMIN,
      isActive: true,
      createdAt: new Date(),
    });
    (jwt.sign as jest.Mock).mockReturnValue('jwt_token');

    const result = await authService.bootstrapAdmin({
      name: 'Bootstrap Admin',
      email: 'bootstrap@test.com',
      password: 'password123',
    });

    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    expect(result.user.role).toBe(Role.ADMIN);
    expect(result.token).toBe('jwt_token');
  });
});
