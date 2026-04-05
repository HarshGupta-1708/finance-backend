import bcrypt from 'bcryptjs';
import request from 'supertest';
import { RecordType, Role } from '@prisma/client';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { ensureSafeIntegrationDatabase } from './ensureTestDatabase';

ensureSafeIntegrationDatabase();

const createCategory = async (name: string, type: RecordType) =>
  prisma.category.create({
    data: {
      name,
      type,
    },
  });

const createUserAndToken = async () => {
  const passwordHash = await bcrypt.hash('analystpass123', 12);

  await prisma.user.create({
    data: {
      name: 'Analyst',
      email: 'analyst@test.com',
      passwordHash,
      role: Role.ANALYST,
    },
  });

  const loginResponse = await request(app).post('/api/auth/login').send({
    email: 'analyst@test.com',
    password: 'analystpass123',
  });

  return loginResponse.body.data.token as string;
};

describe('Records Endpoints', () => {
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

  it('POST /api/records should create a record', async () => {
    const token = await createUserAndToken();
    const incomeCategory = await createCategory('Salary', RecordType.INCOME);

    const response = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 5000,
        type: 'INCOME',
        categoryId: incomeCategory.id,
        recordDate: '2026-04-05',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.category.id).toBe(incomeCategory.id);
    expect(response.body.data.recordDate).toContain('2026-04-05');
  });

  it('GET /api/records should return paginated list', async () => {
    const token = await createUserAndToken();
    const incomeCategory = await createCategory('Salary', RecordType.INCOME);

    await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 5000,
        type: 'INCOME',
        categoryId: incomeCategory.id,
        recordDate: '2026-04-05',
      });

    const response = await request(app)
      .get('/api/records?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.pagination).toBeDefined();
    expect(response.body.data.data[0].category.name).toBe('Salary');
  });
});
