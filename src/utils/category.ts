export const normalizeCategoryName = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
