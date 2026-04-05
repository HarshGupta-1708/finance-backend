import { Role } from '@prisma/client';
import { prisma } from '../../src/config/database';
import * as recordsService from '../../src/modules/records/records.service';
import { ForbiddenError } from '../../src/utils/errors';

jest.mock('../../src/config/database', () => ({
  prisma: {
    $transaction: jest.fn(),
    user: {
      findFirst: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
    financialRecord: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

describe('Records Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(prisma));
  });

  it('createRecord should create a record', async () => {
    const mockRecord = {
      id: 'record-1',
      amount: { toString: () => '1000.00' },
      type: 'INCOME',
      categoryId: 1,
      recordDate: new Date('2026-04-05T00:00:00.000Z'),
      notes: null,
      userId: 'user-id',
      createdBy: 'user-id',
      updatedBy: null,
      deletedAt: null,
      createdAt: new Date('2026-04-05T00:00:00.000Z'),
      updatedAt: new Date('2026-04-05T00:00:00.000Z'),
      user: { id: 'user-id', name: 'Analyst' },
      creator: { id: 'user-id', name: 'Analyst' },
      updater: null,
      category: { id: 1, name: 'Salary', type: 'INCOME', isActive: true },
    };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: 'user-id',
      isActive: true,
    });
    (prisma.category.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Salary',
      type: 'INCOME',
      isActive: true,
    });
    (prisma.financialRecord.create as jest.Mock).mockResolvedValue(mockRecord);
    (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-1' });

    const result = await recordsService.createRecord(
      'user-id',
      Role.ANALYST,
      {
        amount: 1000,
        type: 'INCOME',
        categoryId: 1,
        recordDate: '2026-04-05',
      },
      '127.0.0.1',
    );

    expect(prisma.financialRecord.create).toHaveBeenCalledTimes(1);
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockRecord);
  });

  it('updateRecord should reject non-owner analyst', async () => {
    (prisma.financialRecord.findFirst as jest.Mock).mockResolvedValue({
      id: 'record-1',
      amount: { toString: () => '1000.00' },
      type: 'INCOME',
      categoryId: 1,
      recordDate: new Date('2026-04-05T00:00:00.000Z'),
      notes: null,
      userId: 'owner-id',
      createdBy: 'owner-id',
      updatedBy: null,
      deletedAt: null,
      createdAt: new Date('2026-04-05T00:00:00.000Z'),
      updatedAt: new Date('2026-04-05T00:00:00.000Z'),
      user: { id: 'owner-id', name: 'Owner' },
      creator: { id: 'owner-id', name: 'Owner' },
      updater: null,
      category: { id: 1, name: 'Salary', type: 'INCOME', isActive: true },
    });

    await expect(
      recordsService.updateRecord('record-1', 'other-user', Role.ANALYST, {
        notes: 'Updated',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
