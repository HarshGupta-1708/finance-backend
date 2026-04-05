import { Prisma, RecordType } from '@prisma/client';
import { prisma } from '../../config/database';
import { normalizeCategoryName } from '../../utils/category';
import { AppError, NotFoundError } from '../../utils/errors';
import type {
  CreateCategoryInput,
  ListCategoriesInput,
  UpdateCategoryInput,
} from './categories.schema';

const categorySelect = {
  id: true,
  name: true,
  type: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      records: true,
    },
  },
} satisfies Prisma.CategorySelect;

export const getCategoryById = async (categoryId: number) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: categorySelect,
  });

  if (!category) {
    throw new NotFoundError('Category');
  }

  return category;
};

export const getActiveCategoryForType = async (
  categoryId: number,
  recordType: RecordType,
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

  if (category.type !== recordType) {
    throw new AppError('Category type does not match record type', 400);
  }

  return category;
};

export const listCategories = async (filters: ListCategoriesInput) => {
  const { type, search, includeInactive } = filters;

  return prisma.category.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(!includeInactive ? { isActive: true } : {}),
      ...(search
        ? {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {}),
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    select: categorySelect,
  });
};

export const createCategory = async (input: CreateCategoryInput) => {
  const normalizedName = normalizeCategoryName(input.name);

  const existing = await prisma.category.findFirst({
    where: {
      type: input.type,
      name: {
        equals: normalizedName,
        mode: 'insensitive',
      },
    },
  });

  if (existing) {
    throw new AppError('Category already exists for this record type', 409);
  }

  return prisma.category.create({
    data: {
      name: normalizedName,
      type: input.type,
      description: input.description?.trim() || null,
    },
    select: categorySelect,
  });
};

export const updateCategory = async (
  categoryId: number,
  input: UpdateCategoryInput,
) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new NotFoundError('Category');
  }

  const normalizedName = input.name ? normalizeCategoryName(input.name) : undefined;

  if (normalizedName) {
    const duplicate = await prisma.category.findFirst({
      where: {
        id: {
          not: categoryId,
        },
        type: category.type,
        name: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
    });

    if (duplicate) {
      throw new AppError('Category already exists for this record type', 409);
    }
  }

  return prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(normalizedName ? { name: normalizedName } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    select: categorySelect,
  });
};
