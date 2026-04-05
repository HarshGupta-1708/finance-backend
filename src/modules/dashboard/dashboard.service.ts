import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { parseDateOnly } from '../../utils/date';

const buildAccessWhere = (userId: string, role: Role) =>
  role === Role.ADMIN ? {} : { userId };

const buildDateRange = (startDate?: string, endDate?: string) =>
  startDate || endDate
    ? {
        gte: startDate ? parseDateOnly(startDate) : undefined,
        lte: endDate ? parseDateOnly(endDate) : undefined,
      }
    : undefined;

const recentActivityInclude = {
  user: {
    select: {
      id: true,
      name: true,
    },
  },
  creator: {
    select: {
      id: true,
      name: true,
    },
  },
  updater: {
    select: {
      id: true,
      name: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      type: true,
      isActive: true,
    },
  },
} satisfies Prisma.FinancialRecordInclude;

export const getSummary = async (
  userId: string,
  role: Role,
  startDate?: string,
  endDate?: string,
) => {
  const recordDate = buildDateRange(startDate, endDate);

  const where: Prisma.FinancialRecordWhereInput = {
    deletedAt: null,
    ...buildAccessWhere(userId, role),
    ...(recordDate ? { recordDate } : {}),
  };

  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.financialRecord.aggregate({
      where: { ...where, type: 'INCOME' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.financialRecord.aggregate({
      where: { ...where, type: 'EXPENSE' },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalIncome = Number(incomeAgg._sum.amount || 0);
  const totalExpenses = Number(expenseAgg._sum.amount || 0);

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    totalRecords: incomeAgg._count + expenseAgg._count,
  };
};

export const getCategoryBreakdown = async (
  userId: string,
  role: Role,
  startDate?: string,
  endDate?: string,
) => {
  const recordDate = buildDateRange(startDate, endDate);

  const where: Prisma.FinancialRecordWhereInput = {
    deletedAt: null,
    ...buildAccessWhere(userId, role),
    ...(recordDate ? { recordDate } : {}),
  };

  const grouped = await prisma.financialRecord.groupBy({
    by: ['categoryId', 'type'],
    where,
    _sum: {
      amount: true,
    },
    _count: true,
    orderBy: {
      _sum: {
        amount: 'desc',
      },
    },
  });

  const categoryIds = grouped.map((item) => item.categoryId);
  const categories = categoryIds.length
    ? await prisma.category.findMany({
        where: {
          id: {
            in: categoryIds,
          },
        },
        select: {
          id: true,
          name: true,
          type: true,
          isActive: true,
        },
      })
    : [];

  const categoryMap = new Map(categories.map((item) => [item.id, item]));

  return grouped.map((item) => ({
    categoryId: item.categoryId,
    categoryName: categoryMap.get(item.categoryId)?.name || 'Unknown',
    type: item.type,
    total: Number(item._sum.amount || 0),
    count: item._count,
    isActiveCategory: categoryMap.get(item.categoryId)?.isActive ?? false,
  }));
};

export const getMonthlyTrends = async (
  userId: string,
  role: Role,
  year?: number,
) => {
  const targetYear = year || new Date().getUTCFullYear();

  const result = await prisma.$queryRaw<Array<{
    month: unknown;
    type: 'INCOME' | 'EXPENSE';
    total: unknown;
    count: unknown;
  }>>(Prisma.sql`
    SELECT
      EXTRACT(MONTH FROM "recordDate") AS month,
      type,
      SUM(amount) AS total,
      COUNT(*) AS count
    FROM "FinancialRecord"
    WHERE "deletedAt" IS NULL
      ${role !== Role.ADMIN ? Prisma.sql`AND "userId" = ${userId}` : Prisma.empty}
      AND EXTRACT(YEAR FROM "recordDate") = ${targetYear}
    GROUP BY month, type
    ORDER BY month
  `);

  return result.map((row) => ({
    month: Number(row.month),
    type: row.type,
    total: Number(row.total),
    count: Number(row.count),
  }));
};

export const getRecentActivity = async (
  userId: string,
  role: Role,
  limit = 10,
) => {
  return prisma.financialRecord.findMany({
    where: {
      deletedAt: null,
      ...buildAccessWhere(userId, role),
    },
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    include: recentActivityInclude,
  });
};
