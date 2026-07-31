import { normalizeSeries } from './normalizeSeries';

/**
 * Rendered as a ranked ledger list rather than a map, since state-level
 * choropleths need real geographic boundary data we don't have here —
 * a ranked bar list communicates "who's winning" just as clearly.
 */
export default function StateRevenueChart({ data }) {
  const series = normalizeSeries(data).sort((a, b) => b.value - a.value);

  if (series.length === 0) {
    return <p className="mm-loading-tag">No state revenue data yet.</p>;
  }

  const max = Math.max(...series.map((s) => s.value), 1);

  return (
    <div>
      {series.map((row, idx) => (
        <div
          key={row.name}
          style={{
            display: 'grid',
            gridTemplateColumns: '20px 110px 1fr 90px',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <span className="mm-mono" style={{ fontSize: 11, color: 'var(--mm-text-muted)' }}>
            {idx + 1}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--mm-ink)' }}>
            {row.name}
          </span>
          <div style={{ background: 'var(--mm-brand-wash)', borderRadius: 6, height: 10 }}>
            <div
              style={{
                width: `${(row.value / max) * 100}%`,
                background: 'var(--mm-brand)',
                height: '100%',
                borderRadius: 6,
              }}
            />
          </div>
          <span className="mm-mono" style={{ fontSize: 12, textAlign: 'right' }}>
            {row.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
