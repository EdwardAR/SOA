import { useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

const normalizeValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;

  const text = String(value).trim();
  const parsedDate = Date.parse(text);

  if (!Number.isNaN(parsedDate) && /[-/:T]/.test(text)) {
    return parsedDate;
  }

  const numeric = Number(text);
  if (!Number.isNaN(numeric) && text !== '') {
    return numeric;
  }

  return text.toLowerCase();
};

export const sortRows = <T extends Record<string, any>>(rows: T[], sortConfig: SortConfig) => {
  const directionFactor = sortConfig.direction === 'asc' ? 1 : -1;

  return [...rows].sort((left, right) => {
    const leftValue = normalizeValue(left?.[sortConfig.key]);
    const rightValue = normalizeValue(right?.[sortConfig.key]);

    if (leftValue < rightValue) return -1 * directionFactor;
    if (leftValue > rightValue) return 1 * directionFactor;
    return 0;
  });
};

export const useSortableData = <T extends Record<string, any>>(rows: T[], initialKey: string) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: initialKey,
    direction: 'asc',
  });

  const requestSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return {
    sortConfig,
    requestSort,
    sortedRows: sortRows(rows, sortConfig),
  };
};