import { Role } from '@prisma/client';
import { prisma } from '../../src/config/database';
import * as dashboardService from '../../src/modules/dashboard/dashboard.service';

jest.mock('../../src/config/database', () => ({
  prisma: {
    financialRecord: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

describe('Dashboard Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getSummary should calculate totals and balance', async () => {
    (prisma.financialRecord.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { amount: 5000 }, _count: 4 })
      .mockResolvedValueOnce({ _sum: { amount: 1200 }, _count: 3 });

    const result = await dashboardService.getSummary('user-1', Role.ANALYST);

    expect(result.totalIncome).toBe(5000);
    expect(result.totalExpenses).toBe(1200);
    expect(result.netBalance).toBe(3800);
    expect(result.totalRecords).toBe(7);
  });

  it('getCategoryBreakdown should enrich grouped rows with category names', async () => {
    (prisma.financialRecord.groupBy as jest.Mock).mockResolvedValue([
      {
        categoryId: 1,
        type: 'EXPENSE',
        _sum: { amount: 1250 },
        _count: 3,
      },
    ]);
    (prisma.category.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Rent', type: 'EXPENSE', isActive: true },
    ]);

    const result = await dashboardService.getCategoryBreakdown('user-1', Role.ADMIN);

    expect(result).toEqual([
      {
        categoryId: 1,
        categoryName: 'Rent',
        type: 'EXPENSE',
        total: 1250,
        count: 3,
        isActiveCategory: true,
      },
    ]);
  });

  it('getMonthlyTrends should normalize numeric fields', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([
      { month: '1', type: 'INCOME', total: '1000.50', count: '2' },
    ]);

    const result = await dashboardService.getMonthlyTrends('user-1', Role.ADMIN, 2026);

    expect(result).toEqual([
      { month: 1, type: 'INCOME', total: 1000.5, count: 2 },
    ]);
  });
});
