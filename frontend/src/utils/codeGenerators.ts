type RowLike = Record<string, any>;

function hasValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

export function generateStructuredCode(options: {
  prefix: string;
  rows: RowLike[];
  field: string;
  padding?: number;
  year?: number;
}) {
  const { prefix, rows, field, padding = 4, year = new Date().getFullYear() } = options;
  const normalizedPrefix = prefix.toUpperCase();
  const yearPart = String(year);
  const pattern = new RegExp(`^${normalizedPrefix}-${yearPart}-(\\d+)$`, 'i');
  const usedCodes = new Set(rows.map((row) => String(row?.[field] ?? '').trim()).filter(hasValue));

  let sequence = rows.length + 1;
  let candidate = `${normalizedPrefix}-${yearPart}-${String(sequence).padStart(padding, '0')}`;

  while (usedCodes.has(candidate)) {
    sequence += 1;
    candidate = `${normalizedPrefix}-${yearPart}-${String(sequence).padStart(padding, '0')}`;
  }

  const structuredMatches = rows
    .map((row) => String(row?.[field] ?? '').trim())
    .filter((code) => pattern.test(code));

  if (structuredMatches.length > 0) {
    const maxSequence = structuredMatches.reduce((max, code) => {
      const match = code.match(pattern);
      const current = match ? Number(match[1]) : 0;
      return Number.isFinite(current) ? Math.max(max, current) : max;
    }, 0);

    sequence = maxSequence + 1;
    candidate = `${normalizedPrefix}-${yearPart}-${String(sequence).padStart(padding, '0')}`;

    while (usedCodes.has(candidate)) {
      sequence += 1;
      candidate = `${normalizedPrefix}-${yearPart}-${String(sequence).padStart(padding, '0')}`;
    }
  }

  return candidate;
}
