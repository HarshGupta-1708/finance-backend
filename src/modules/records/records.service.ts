import { AuditAction, Prisma, RecordType, Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { formatDateOnly, parseDateOnly } from '../../utils/date';
import { buildPaginatedResult } from '../../utils/pagination';
import { AppError, ForbiddenError, NotFoundError } from '../../utils/errors';
import type {
  CreateRecordInput,
  ListRecordsInput,
  UpdateRecordInput,
} from './records.schema';

const recordInclude = {
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

type RecordWithRelations = Prisma.FinancialRecordGetPayload<{
  include: typeof recordInclude;
}>;

const serializeRecordSnapshot = (record: RecordWithRelations) => ({
  id: record.id,
  amount:
    record.amount && typeof record.amount === 'object' && 'toString' in record.amount
      ? record.amount.toString()
      : record.amount,
  type: record.type,
  categoryId: record.categoryId,
  recordDate: formatDateOnly(record.recordDate),
  notes: record.notes,
  userId: record.userId,
  createdBy: record.createdBy,
  updatedBy: record.updatedBy,
  deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
  user: record.user ? { id: record.user.id, name: record.user.name } : null,
  creator: record.creator ? { id: record.creator.id, name: record.creator.name } : null,
  updater: record.updater ? { id: record.updater.id, name: record.updater.name } : null,
  category: record.category
    ? {
        id: record.category.id,
        name: record.category.name,
        type: record.category.type,
        isActive: record.category.isActive,
      }
    : null,
});

const findActiveCategoryForType = async (
  categoryId: number,
  type: RecordType,
) => {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      isActive: true,
    },
  });

  if (!category) {
    throw new NotFoundError('Category');
  }

  if (category.type !== type) {
    throw new AppError('Category type does not match record type', 400);
  }

  return category;
};

const resolveOwnerId = async (
  requesterId: string,
  requesterRole: Role,
  requestedOwnerId?: string,
) => {
  if (requestedOwnerId && requesterRole !== Role.ADMIN && requestedOwnerId !== requesterId) {
    throw new ForbiddenError('Only admins can create records for other users');
  }

  const ownerId =
    requesterRole === Role.ADMIN && requestedOwnerId ? requestedOwnerId : requesterId;

  const user = await prisma.user.findFirst({
    where: {
      id: ownerId,
      deletedAt: null,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError('Target user is inactive or not found', 400);
  }

  return ownerId;
};

const getRecordOrThrow = async (recordId: string) => {
  const record = await prisma.financialRecord.findFirst({
    where: {
      id: recordId,
      deletedAt: null,
    },
    include: recordInclude,
  });

  if (!record) {
    throw new NotFoundError('Record');
  }

  return record;
};

const ensureCanAccessRecord = (
  record: { userId: string },
  requesterId: string,
  requesterRole: Role,
) => {
  if (requesterRole !== Role.ADMIN && record.userId !== requesterId) {
    throw new ForbiddenError();
  }
};

export const createRecord = async (
  requesterId: string,
  requesterRole: Role,
  data: CreateRecordInput,
  ipAddress?: string,
) => {
  const ownerId = await resolveOwnerId(requesterId, requesterRole, data.userId);
  await findActiveCategoryForType(data.categoryId, data.type);

  return prisma.$transaction(async (tx) => {
    const record = await tx.financialRecord.create({
      data: {
        amount: new Prisma.Decimal(data.amount),
        type: data.type,
        categoryId: data.categoryId,
        recordDate: parseDateOnly(data.recordDate),
        notes: data.notes?.trim() || null,
        userId: ownerId,
        createdBy: requesterId,
      },
      include: recordInclude,
    });

    await tx.auditLog.create({
      data: {
        tableName: 'FinancialRecord',
        recordId: record.id,
        action: AuditAction.CREATE,
        performedBy: requesterId,
        oldData: Prisma.JsonNull,
        newData: serializeRecordSnapshot(record),
        ipAddress: ipAddress || null,
      },
    });

    return record;
  });
};

export const getRecords = async (
  filters: ListRecordsInput,
  requesterId: string,
  requesterRole: Role,
) => {
  const {
    type,
    categoryId,
    category,
    startDate,
    endDate,
    search,
    page,
    limit,
  } = filters;

  const where: Prisma.FinancialRecordWhereInput = {
    deletedAt: null,
    ...(requesterRole !== Role.ADMIN ? { userId: requesterId } : {}),
    ...(type ? { type } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(category
      ? {
          category: {
            name: {
              contains: category,
              mode: 'insensitive',
            },
          },
        }
      : {}),
    ...(startDate || endDate
      ? {
          recordDate: {
            ...(startDate ? { gte: parseDateOnly(startDate) } : {}),
            ...(endDate ? { lte: parseDateOnly(endDate) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            {
              category: {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
            {
              notes: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {}),
  };

  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ recordDate: 'desc' }, { createdAt: 'desc' }],
      include: recordInclude,
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return buildPaginatedResult(records, total, page, limit);
};

export const getRecordById = async (
  recordId: string,
  requesterId: string,
  requesterRole: Role,
) => {
  const record = await getRecordOrThrow(recordId);
  ensureCanAccessRecord(record, requesterId, requesterRole);
  return record;
};

export const updateRecord = async (
  recordId: string,
  requesterId: string,
  requesterRole: Role,
  data: UpdateRecordInput,
  ipAddress?: string,
) => {
  const record = await getRecordOrThrow(recordId);
  ensureCanAccessRecord(record, requesterId, requesterRole);

  const nextType = data.type ?? record.type;
  const nextCategoryId = data.categoryId ?? record.categoryId;
  await findActiveCategoryForType(nextCategoryId, nextType);

  return prisma.$transaction(async (tx) => {
    const updatedRecord = await tx.financialRecord.update({
      where: { id: recordId },
      data: {
        ...(data.amount !== undefined ? { amount: new Prisma.Decimal(data.amount) } : {}),
        ...(data.type ? { type: data.type } : {}),
        ...(data.categoryId ? { categoryId: data.categoryId } : {}),
        ...(data.recordDate ? { recordDate: parseDateOnly(data.recordDate) } : {}),
        ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
        updatedBy: requesterId,
      },
      include: recordInclude,
    });

    await tx.auditLog.create({
      data: {
        tableName: 'FinancialRecord',
        recordId: updatedRecord.id,
        action: AuditAction.UPDATE,
        performedBy: requesterId,
        oldData: serializeRecordSnapshot(record),
        newData: serializeRecordSnapshot(updatedRecord),
        ipAddress: ipAddress || null,
      },
    });

    return updatedRecord;
  });
};

export const deleteRecord = async (
  recordId: string,
  requesterId: string,
  requesterRole: Role,
  ipAddress?: string,
) => {
  const record = await getRecordOrThrow(recordId);
  ensureCanAccessRecord(record, requesterId, requesterRole);

  await prisma.$transaction(async (tx) => {
    const deletedRecord = await tx.financialRecord.update({
      where: { id: recordId },
      data: {
        deletedAt: new Date(),
        updatedBy: requesterId,
      },
      include: recordInclude,
    });

    await tx.auditLog.create({
      data: {
        tableName: 'FinancialRecord',
        recordId: deletedRecord.id,
        action: AuditAction.DELETE,
        performedBy: requesterId,
        oldData: serializeRecordSnapshot(record),
        newData: serializeRecordSnapshot(deletedRecord),
        ipAddress: ipAddress || null,
      },
    });
  });
};
