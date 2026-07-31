/**
 * Renders one KPI as a "price tag" card. Your backend already returns
 * human-readable Title Case keys (e.g. "Total Revenue"), so labels are
 * used as-is; snake_case/camelCase fallbacks are still prettified in case
 * other endpoints return differently-cased keys.
 */
function formatValue(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    return value % 1 === 0
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(value);
}

function labelize(key) {
  if (key.includes(' ')) return key; // already formatted, e.g. "Total Revenue"
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function KPICard({ label, value, prefix = '', suffix = '' }) {
  return (
    <div className="mm-kpi-tag">
      <span className="mm-kpi-label">{label}</span>
      <div className="mm-kpi-value mm-mono">
        {prefix}
        {formatValue(value)}
        {suffix}
      </div>
    </div>
  );
}

// Renders every top-level scalar (number/string) key in a KPI object as a
// card. Nested objects (like "Category Wise Sales") are skipped here —
// those get their own chart component instead.
export function KPIGrid({ data }) {
  if (!data || typeof data !== 'object') {
    return <p className="mm-loading-tag">No KPI data available.</p>;
  }
  const entries = Object.entries(data).filter(
    ([, v]) => typeof v === 'number' || typeof v === 'string'
  );
  if (entries.length === 0) {
    return <p className="mm-loading-tag">No KPI data available.</p>;
  }
  return (
    <div className="mm-kpi-grid">
      {entries.map(([key, value]) => (
        <KPICard key={key} label={labelize(key)} value={value} />
      ))}
    </div>
  );
}
