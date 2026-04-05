import bcrypt from 'bcryptjs';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { ensureSafeIntegrationDatabase } from './ensureTestDatabase';

ensureSafeIntegrationDatabase();

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.financialRecord.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/auth/register should register a new user', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });

  it('POST /api/auth/login should login existing user', async () => {
    const passwordHash = await bcrypt.hash('password123', 12);
    await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'login@example.com',
        passwordHash,
      },
    });

    const response = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeDefined();
  });
});
