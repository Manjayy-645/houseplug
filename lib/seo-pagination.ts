export function parseBrowsePage(value?: string) {
  if (value === undefined) return { page: 1, valid: true };
  if (!/^[1-9][0-9]*$/.test(value))
    return { page: 1, valid: false };
  const page = Number(value);
  return Number.isSafeInteger(page) && page <= 10000
    ? { page, valid: true }
    : { page: 1, valid: false };
}
