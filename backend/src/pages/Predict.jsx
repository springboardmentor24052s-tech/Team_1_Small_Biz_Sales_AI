import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { predictSales } from '../api/dashboard';

// Matches SalesInput in main.py exactly. Every field except B2B is an int —
// these are label-encoded categorical values from your training pipeline
// (see check_features.py / prepare_training_data.py), not free text, so a
// plain number input is what the backend actually expects.
const NUMERIC_FIELDS = [
  ['Status', 'Order status (encoded)'],
  ['Fulfilment', 'Fulfilment type (encoded)'],
  ['Sales_Channel', 'Sales channel (encoded)'],
  ['ship_service_level', 'Ship service level (encoded)'],
  ['Category', 'Product category (encoded)'],
  ['Size', 'Size (encoded)'],
  ['Courier_Status', 'Courier status (encoded)'],
  ['Qty', 'Quantity'],
  ['ship_city', 'Ship city (encoded)'],
  ['ship_state', 'Ship state (encoded)'],
  ['ship_postal_code', 'Ship postal code'],
  ['promotion_ids', 'Promotion ID (encoded)'],
  ['fulfilled_by', 'Fulfilled by (encoded)'],
];

const EMPTY_FORM = NUMERIC_FIELDS.reduce((acc, [key]) => ({ ...acc, [key]: '' }), {
  B2B: false,
  date: '',
});

export default function Predict() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const updateDate = (e) => {
    const value = e.target.value; // yyyy-mm-dd
    setForm((f) => ({ ...f, date: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!form.date) {
      setError('Pick a date — it fills in Year, Month, Day, and DayOfWeek automatically.');
      return;
    }

    const d = new Date(form.date + 'T00:00:00');
    setLoading(true);
    try {
      const payload = {
        Status: Number(form.Status),
        Fulfilment: Number(form.Fulfilment),
        Sales_Channel: Number(form.Sales_Channel),
        ship_service_level: Number(form.ship_service_level),
        Category: Number(form.Category),
        Size: Number(form.Size),
        Courier_Status: Number(form.Courier_Status),
        Qty: Number(form.Qty),
        ship_city: Number(form.ship_city),
        ship_state: Number(form.ship_state),
        ship_postal_code: Number(form.ship_postal_code),
        promotion_ids: Number(form.promotion_ids),
        B2B: Boolean(form.B2B),
        fulfilled_by: Number(form.fulfilled_by),
        Year: d.getFullYear(),
        Month: d.getMonth() + 1,
        Day: d.getDate(),
        DayOfWeek: d.getDay(),
      };
      const data = await predictSales(payload);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Check the inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      eyebrow="AI Analytics"
      title="Sales forecast"
      subtitle="Run the trained model (sales_model.pkl) for a specific order profile."
    >
      {error && <div className="mm-alert-banner">{error}</div>}

      <div className="mm-panel">
        <div className="mm-panel-title">Predict sales amount</div>
        <div className="mm-panel-sub">
          Sent to POST /predict. Encoded fields must use the same label
          encoding as training — check check_features.py if predictions look off.
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
          <div className="mm-inline-form">
            <div className="mm-field">
              <label htmlFor="date">Order date</label>
              <input id="date" type="date" value={form.date} onChange={updateDate} required />
            </div>
            <div className="mm-field">
              <label htmlFor="B2B">
                <input
                  id="B2B"
                  type="checkbox"
                  checked={form.B2B}
                  onChange={(e) => setForm((f) => ({ ...f, B2B: e.target.checked }))}
                  style={{ marginRight: 6 }}
                />
                B2B order
              </label>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0 16px',
            }}
          >
            {NUMERIC_FIELDS.map(([key, label]) => (
              <div className="mm-field" key={key}>
                <label htmlFor={key}>{label}</label>
                <input
                  id={key}
                  type="number"
                  value={form[key]}
                  onChange={updateField(key)}
                  required
                />
              </div>
            ))}
          </div>

          <button className="mm-btn" type="submit" disabled={loading}>
            {loading ? 'Predicting…' : 'Run prediction'}
          </button>
        </form>

        {result && (
          <div className="mm-kpi-tag" style={{ marginTop: 24, maxWidth: 280 }}>
            <span className="mm-kpi-label">Predicted Sales Amount</span>
            <div className="mm-kpi-value mm-mono">
              {result['Predicted Sales Amount'] ?? JSON.stringify(result)}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
