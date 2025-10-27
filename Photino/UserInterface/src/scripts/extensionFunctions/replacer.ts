export function skipEmptyReplacer(key: string, value: any) {
  // Skip undefined, null, empty strings, empty arrays, and empty objects
  if (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
  ) {
    return undefined;
  }

  return value;
}