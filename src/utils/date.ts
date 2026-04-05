export const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
};

export const formatDateOnly = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
};
