import bcrypt from 'bcryptjs';
import request from 'supertest';
import { Role } from '@prisma/client';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { ensureSafeIntegrationDatabase } from './ensureTestDatabase';

ensureSafeIntegrationDatabase();

const getAdminToken = async () => {
  const passwordHash = await bcrypt.hash('adminpass123', 12);
  await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@test.com',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const loginResponse = await request(app).post('/api/auth/login').send({
    email: 'admin@test.com',
    password: 'adminpass123',
  });

  return loginResponse.body.data.token as string;
};

describe('Users Endpoints', () => {
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

  it('GET /api/users should return users for admin', async () => {
    const token = await getAdminToken();

    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.pagination).toBeDefined();
  });
});
