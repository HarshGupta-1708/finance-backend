import bcrypt from 'bcryptjs';
import request from 'supertest';
import { RecordType, Role } from '@prisma/client';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { ensureSafeIntegrationDatabase } from './ensureTestDatabase';

ensureSafeIntegrationDatabase();

const createAdminAndToken = async () => {
  const passwordHash = await bcrypt.hash('adminpass123', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin-dashboard@test.com',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const incomeCategory = await prisma.category.create({
    data: {
      name: 'Salary',
      type: RecordType.INCOME,
    },
  });

  const expenseCategory = await prisma.category.create({
    data: {
      name: 'Food',
      type: RecordType.EXPENSE,
    },
  });

  await prisma.financialRecord.createMany({
    data: [
      {
        amount: '1000.00',
        type: 'INCOME',
        categoryId: incomeCategory.id,
        recordDate: new Date('2026-04-05T00:00:00.000Z'),
        userId: admin.id,
        createdBy: admin.id,
      },
      {
        amount: '250.00',
        type: 'EXPENSE',
        categoryId: expenseCategory.id,
        recordDate: new Date('2026-04-06T00:00:00.000Z'),
        userId: admin.id,
        createdBy: admin.id,
      },
    ],
  });

  const loginResponse = await request(app).post('/api/auth/login').send({
    email: 'admin-dashboard@test.com',
    password: 'adminpass123',
  });

  return loginResponse.body.data.token as string;
};

describe('Dashboard Endpoints', () => {
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

  it('GET /api/dashboard/summary should return aggregates', async () => {
    const token = await createAdminAndToken();

    const response = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.totalIncome).toBeGreaterThanOrEqual(0);
    expect(response.body.data.totalExpenses).toBeGreaterThanOrEqual(0);
  });
});
