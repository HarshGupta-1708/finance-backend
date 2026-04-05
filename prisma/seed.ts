import { PrismaClient, RecordType, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const CURRENT_YEAR = new Date().getUTCFullYear();
const PREVIOUS_YEAR = CURRENT_YEAR - 1;
const SEED_NOTE_PREFIX = '[seed]';

interface SeedUserSpec {
  key: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  isActive?: boolean;
}

interface SeedCategorySpec {
  key: string;
  name: string;
  type: RecordType;
  description?: string;
  isActive?: boolean;
}

interface SeedRecordInput {
  userId: string;
  createdBy: string;
  updatedBy?: string | null;
  amount: string;
  type: RecordType;
  categoryKey: string;
  recordDate: Date;
  notes: string;
  deletedAt?: Date | null;
}

const seedUsers: SeedUserSpec[] = [
  {
    key: 'admin',
    name: 'Admin User',
    email: 'admin@finance.com',
    password: 'admin@1234',
    role: Role.ADMIN,
  },
  {
    key: 'analyst',
    name: 'Analyst User',
    email: 'analyst@finance.com',
    password: 'analyst@1234',
    role: Role.ANALYST,
  },
  {
    key: 'viewer',
    name: 'Viewer User',
    email: 'viewer@finance.com',
    password: 'viewer@1234',
    role: Role.VIEWER,
  },
  {
    key: 'opsAnalyst',
    name: 'Operations Analyst',
    email: 'ops.analyst@finance.com',
    password: 'opsanalyst@1234',
    role: Role.ANALYST,
  },
  {
    key: 'inactiveViewer',
    name: 'Inactive Viewer',
    email: 'inactive.viewer@finance.com',
    password: 'viewer@1234',
    role: Role.VIEWER,
    isActive: false,
  },
];

const seedCategories: SeedCategorySpec[] = [
  { key: 'salary', name: 'Salary', type: RecordType.INCOME, description: 'Fixed salary income' },
  { key: 'consulting', name: 'Consulting', type: RecordType.INCOME, description: 'Client consulting revenue' },
  { key: 'investments', name: 'Investments', type: RecordType.INCOME, description: 'Investment returns' },
  { key: 'freelance', name: 'Freelance', type: RecordType.INCOME, description: 'Freelance project payments' },
  { key: 'bonus', name: 'Bonus', type: RecordType.INCOME, description: 'Performance or special bonuses' },
  { key: 'rent', name: 'Rent', type: RecordType.EXPENSE, description: 'Office or personal rent' },
  { key: 'food', name: 'Food', type: RecordType.EXPENSE, description: 'Food and dining expenses' },
  { key: 'transport', name: 'Transport', type: RecordType.EXPENSE, description: 'Local transport costs' },
  { key: 'utilities', name: 'Utilities', type: RecordType.EXPENSE, description: 'Utility bills and services' },
  { key: 'entertainment', name: 'Entertainment', type: RecordType.EXPENSE, description: 'Entertainment spending' },
  { key: 'software', name: 'Software', type: RecordType.EXPENSE, description: 'Software subscriptions' },
  { key: 'travel', name: 'Travel', type: RecordType.EXPENSE, description: 'Travel and lodging' },
  { key: 'taxes', name: 'Taxes', type: RecordType.EXPENSE, description: 'Tax payments' },
  { key: 'insurance', name: 'Insurance', type: RecordType.EXPENSE, description: 'Insurance payments' },
  { key: 'marketing', name: 'Marketing', type: RecordType.EXPENSE, description: 'Marketing spend' },
  { key: 'office', name: 'Office', type: RecordType.EXPENSE, description: 'Office supplies and services' },
  { key: 'healthcare', name: 'Healthcare', type: RecordType.EXPENSE, description: 'Medical and healthcare costs' },
  { key: 'subscriptions', name: 'Subscriptions', type: RecordType.EXPENSE, description: 'Recurring subscriptions' },
  { key: 'operations', name: 'Operations', type: RecordType.EXPENSE, description: 'Operational expenses' },
  { key: 'training', name: 'Training', type: RecordType.EXPENSE, description: 'Learning and training' },
  { key: 'logistics', name: 'Logistics', type: RecordType.EXPENSE, description: 'Shipping and logistics' },
  { key: 'groceries', name: 'Groceries', type: RecordType.EXPENSE, description: 'Household grocery spend' },
  {
    key: 'legacyExpense',
    name: 'Legacy Expense',
    type: RecordType.EXPENSE,
    description: 'Inactive category kept for lifecycle checks',
    isActive: false,
  },
];

const toUtcDate = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

const buildMonthlyProfile = (config: {
  userId: string;
  createdBy?: string;
  ownerLabel: string;
  year: number;
  months: number[];
  primaryIncomeCategoryKey: string;
  primaryIncomeBase: number;
  primaryIncomeStep: number;
  primaryExpenseCategoryKey: string;
  primaryExpenseBase: number;
  primaryExpenseStep: number;
  secondaryExpenseCategoryKeys: string[];
  secondaryExpenseBase: number;
  secondaryExpenseStep: number;
  sideIncomeCategoryKeys?: string[];
  sideIncomeBase?: number;
  sideIncomeStep?: number;
}): SeedRecordInput[] => {
  const {
    userId,
    createdBy = userId,
    ownerLabel,
    year,
    months,
    primaryIncomeCategoryKey,
    primaryIncomeBase,
    primaryIncomeStep,
    primaryExpenseCategoryKey,
    primaryExpenseBase,
    primaryExpenseStep,
    secondaryExpenseCategoryKeys,
    secondaryExpenseBase,
    secondaryExpenseStep,
    sideIncomeCategoryKeys = [],
    sideIncomeBase = 0,
    sideIncomeStep = 0,
  } = config;

  return months.flatMap((month, index) => {
    const secondaryExpenseCategoryKey =
      secondaryExpenseCategoryKeys[index % secondaryExpenseCategoryKeys.length];

    const records: SeedRecordInput[] = [
      {
        userId,
        createdBy,
        amount: (primaryIncomeBase + index * primaryIncomeStep).toFixed(2),
        type: RecordType.INCOME,
        categoryKey: primaryIncomeCategoryKey,
        recordDate: toUtcDate(year, month, 5),
        notes: `${SEED_NOTE_PREFIX} ${ownerLabel} ${year}-${String(month).padStart(2, '0')} primary income`,
      },
      {
        userId,
        createdBy,
        amount: (primaryExpenseBase + index * primaryExpenseStep).toFixed(2),
        type: RecordType.EXPENSE,
        categoryKey: primaryExpenseCategoryKey,
        recordDate: toUtcDate(year, month, 9),
        notes: `${SEED_NOTE_PREFIX} ${ownerLabel} ${year}-${String(month).padStart(2, '0')} fixed expense`,
      },
      {
        userId,
        createdBy,
        amount: (secondaryExpenseBase + index * secondaryExpenseStep).toFixed(2),
        type: RecordType.EXPENSE,
        categoryKey: secondaryExpenseCategoryKey,
        recordDate: toUtcDate(year, month, 21),
        notes: `${SEED_NOTE_PREFIX} ${ownerLabel} ${year}-${String(month).padStart(2, '0')} variable expense`,
      },
    ];

    if (sideIncomeCategoryKeys.length > 0) {
      records.push({
        userId,
        createdBy,
        amount: (sideIncomeBase + index * sideIncomeStep).toFixed(2),
        type: RecordType.INCOME,
        categoryKey: sideIncomeCategoryKeys[index % sideIncomeCategoryKeys.length],
        recordDate: toUtcDate(year, month, 26),
        notes: `${SEED_NOTE_PREFIX} ${ownerLabel} ${year}-${String(month).padStart(2, '0')} side income`,
      });
    }

    return records;
  });
};

async function main() {
  console.log('Seeding database...');

  const seededUsers = await Promise.all(
    seedUsers.map(async (user) => {
      const passwordHash = await bcrypt.hash(user.password, 12);

      const record = await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          passwordHash,
          role: user.role,
          isActive: user.isActive ?? true,
          deletedAt: null,
        },
        create: {
          name: user.name,
          email: user.email,
          passwordHash,
          role: user.role,
          isActive: user.isActive ?? true,
        },
      });

      return [user.key, record] as const;
    }),
  );

  const usersByKey = Object.fromEntries(seededUsers);

  const seededCategories = await Promise.all(
    seedCategories.map(async (category) => {
      const record = await prisma.category.upsert({
        where: {
          name_type: {
            name: category.name,
            type: category.type,
          },
        },
        update: {
          description: category.description || null,
          isActive: category.isActive ?? true,
        },
        create: {
          name: category.name,
          type: category.type,
          description: category.description || null,
          isActive: category.isActive ?? true,
        },
      });

      return [category.key, record] as const;
    }),
  );

  const categoriesByKey = Object.fromEntries(seededCategories);

  await prisma.financialRecord.deleteMany({
    where: {
      OR: [
        {
          notes: {
            startsWith: SEED_NOTE_PREFIX,
          },
        },
        {
          notes: {
            startsWith: 'Sample record ',
          },
        },
      ],
    },
  });

  const records: SeedRecordInput[] = [
    ...buildMonthlyProfile({
      userId: usersByKey.admin.id,
      ownerLabel: 'admin',
      year: CURRENT_YEAR,
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      primaryIncomeCategoryKey: 'salary',
      primaryIncomeBase: 9800,
      primaryIncomeStep: 120,
      primaryExpenseCategoryKey: 'software',
      primaryExpenseBase: 1450,
      primaryExpenseStep: 35,
      secondaryExpenseCategoryKeys: [
        'travel',
        'taxes',
        'insurance',
        'marketing',
        'office',
        'utilities',
      ],
      secondaryExpenseBase: 420,
      secondaryExpenseStep: 22,
      sideIncomeCategoryKeys: ['investments', 'consulting'],
      sideIncomeBase: 850,
      sideIncomeStep: 45,
    }),
    ...buildMonthlyProfile({
      userId: usersByKey.admin.id,
      ownerLabel: 'admin',
      year: PREVIOUS_YEAR,
      months: [9, 10, 11, 12],
      primaryIncomeCategoryKey: 'salary',
      primaryIncomeBase: 9200,
      primaryIncomeStep: 110,
      primaryExpenseCategoryKey: 'software',
      primaryExpenseBase: 1380,
      primaryExpenseStep: 25,
      secondaryExpenseCategoryKeys: ['travel', 'taxes', 'insurance', 'office'],
      secondaryExpenseBase: 380,
      secondaryExpenseStep: 18,
    }),
    ...buildMonthlyProfile({
      userId: usersByKey.analyst.id,
      ownerLabel: 'analyst',
      year: CURRENT_YEAR,
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      primaryIncomeCategoryKey: 'consulting',
      primaryIncomeBase: 5100,
      primaryIncomeStep: 95,
      primaryExpenseCategoryKey: 'rent',
      primaryExpenseBase: 1600,
      primaryExpenseStep: 20,
      secondaryExpenseCategoryKeys: [
        'food',
        'transport',
        'utilities',
        'entertainment',
        'healthcare',
        'subscriptions',
      ],
      secondaryExpenseBase: 360,
      secondaryExpenseStep: 15,
      sideIncomeCategoryKeys: ['freelance', 'bonus'],
      sideIncomeBase: 620,
      sideIncomeStep: 30,
    }),
    ...buildMonthlyProfile({
      userId: usersByKey.viewer.id,
      ownerLabel: 'viewer',
      year: CURRENT_YEAR,
      months: [1, 2, 3, 4, 5, 6, 7, 8],
      primaryIncomeCategoryKey: 'salary',
      primaryIncomeBase: 2900,
      primaryIncomeStep: 40,
      primaryExpenseCategoryKey: 'rent',
      primaryExpenseBase: 1050,
      primaryExpenseStep: 12,
      secondaryExpenseCategoryKeys: ['food', 'transport', 'utilities', 'groceries'],
      secondaryExpenseBase: 220,
      secondaryExpenseStep: 10,
    }),
    ...buildMonthlyProfile({
      userId: usersByKey.opsAnalyst.id,
      ownerLabel: 'ops-analyst',
      year: CURRENT_YEAR,
      months: [3, 4, 5, 6, 7, 8, 9, 10],
      primaryIncomeCategoryKey: 'freelance',
      primaryIncomeBase: 4300,
      primaryIncomeStep: 80,
      primaryExpenseCategoryKey: 'operations',
      primaryExpenseBase: 980,
      primaryExpenseStep: 18,
      secondaryExpenseCategoryKeys: ['software', 'travel', 'training', 'logistics'],
      secondaryExpenseBase: 310,
      secondaryExpenseStep: 12,
    }),
    {
      userId: usersByKey.viewer.id,
      createdBy: usersByKey.admin.id,
      updatedBy: usersByKey.admin.id,
      amount: '1185.00',
      type: RecordType.EXPENSE,
      categoryKey: 'rent',
      recordDate: toUtcDate(CURRENT_YEAR, 3, 28),
      notes: `${SEED_NOTE_PREFIX} delegated viewer rent entry`,
    },
    {
      userId: usersByKey.analyst.id,
      createdBy: usersByKey.admin.id,
      updatedBy: usersByKey.opsAnalyst.id,
      amount: '1450.00',
      type: RecordType.INCOME,
      categoryKey: 'bonus',
      recordDate: toUtcDate(CURRENT_YEAR, 6, 3),
      notes: `${SEED_NOTE_PREFIX} delegated analyst bonus adjustment`,
    },
    {
      userId: usersByKey.admin.id,
      createdBy: usersByKey.admin.id,
      updatedBy: usersByKey.admin.id,
      amount: '499.99',
      type: RecordType.EXPENSE,
      categoryKey: 'travel',
      recordDate: toUtcDate(CURRENT_YEAR, 2, 14),
      notes: `${SEED_NOTE_PREFIX} deleted admin record`,
      deletedAt: new Date(),
    },
    {
      userId: usersByKey.analyst.id,
      createdBy: usersByKey.analyst.id,
      updatedBy: usersByKey.admin.id,
      amount: '899.99',
      type: RecordType.INCOME,
      categoryKey: 'bonus',
      recordDate: toUtcDate(CURRENT_YEAR, 5, 2),
      notes: `${SEED_NOTE_PREFIX} deleted analyst record`,
      deletedAt: new Date(),
    },
    {
      userId: usersByKey.viewer.id,
      createdBy: usersByKey.viewer.id,
      updatedBy: usersByKey.admin.id,
      amount: '120.00',
      type: RecordType.EXPENSE,
      categoryKey: 'food',
      recordDate: toUtcDate(CURRENT_YEAR, 4, 12),
      notes: `${SEED_NOTE_PREFIX} deleted viewer record`,
      deletedAt: new Date(),
    },
  ];

  await prisma.financialRecord.createMany({
    data: records.map((record) => ({
      userId: record.userId,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy ?? null,
      amount: record.amount,
      type: record.type,
      categoryId: categoriesByKey[record.categoryKey].id,
      recordDate: record.recordDate,
      notes: record.notes,
      deletedAt: record.deletedAt ?? null,
    })),
  });

  console.log('Seed complete!');
  console.log('Admin login: admin@finance.com / admin@1234');
  console.log('Analyst login: analyst@finance.com / analyst@1234');
  console.log('Viewer login: viewer@finance.com / viewer@1234');
  console.log('Ops Analyst login: ops.analyst@finance.com / opsanalyst@1234');
  console.log(
    'Inactive Viewer login (expected to fail): inactive.viewer@finance.com / viewer@1234',
  );
  console.log(
    `Seeded ${seedUsers.length} users, ${seedCategories.length} categories, and ${records.length} tagged financial records`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
