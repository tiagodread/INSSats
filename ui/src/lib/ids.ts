let counter = 0;

export function makeId(prefix: string): string {
  counter += 1;
  const now = Date.now().toString(36);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${now}-${counter}-${suffix}`;
}
