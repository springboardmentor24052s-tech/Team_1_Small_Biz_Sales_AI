/**
 * The backend returns chart-ish data as plain objects (e.g. /sales-trend
 * returns { "January": 12345.6, "February": 9800 }), not arrays of
 * { name, value }. This normalizes either shape into the array form the
 * chart components expect.
 */
export function normalizeSeries(raw, { nameKey, valueKey } = {}) {
  if (!raw) return [];

  // Plain object: { "Label": number, ... }
  if (!Array.isArray(raw) && typeof raw === 'object') {
    return Object.entries(raw)
      .filter(([, v]) => typeof v === 'number')
      .map(([name, value]) => ({ name, value }));
  }

  if (!Array.isArray(raw) || raw.length === 0) return [];

  return raw.map((row, idx) => {
    if (nameKey && valueKey) {
      return { name: row[nameKey], value: Number(row[valueKey]) || 0 };
    }
    const keys = Object.keys(row);
    const guessedName = keys.find((k) => typeof row[k] === 'string') || keys[0] || 'name';
    const guessedValue =
      keys.find((k) => typeof row[k] === 'number' && k !== guessedName) ||
      keys.find((k) => k !== guessedName);

    return {
      name: row[guessedName] ?? `#${idx + 1}`,
      value: Number(row[guessedValue]) || 0,
    };
  });
}
