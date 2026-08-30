import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export default function CustomerAnalyticsReport() {
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomerAnalytics();
  }, []);

  async function loadCustomerAnalytics() {
    try {
      setLoading(true);
      setError("");

      const [summaryResponse, customerResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/customer-segments/summary`, {
          credentials: "include",
        }),
        fetch(`${API_BASE_URL}/customer-segments?limit=100`, {
          credentials: "include",
        }),
      ]);

      if (!summaryResponse.ok) {
        throw new Error("Unable to load customer analytics summary.");
      }

      if (!customerResponse.ok) {
        throw new Error("Unable to load customer segments.");
      }

      const summaryData = await summaryResponse.json();
      const customerData = await customerResponse.json();

      setSummary(summaryData);
      setCustomers(customerData.items || []);
    } catch (err) {
      setError(err.message || "Failed to load customer analytics.");
    } finally {
      setLoading(false);
    }
  }

  const segmentData = useMemo(() => {
    const groups = {};

    customers.forEach((customer) => {
      const name =
        customer.segment_name ||
        customer.segment_code ||
        "Unknown";

      groups[name] = (groups[name] || 0) + 1;
    });

    return Object.entries(groups)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [customers]);

  const topCustomers = useMemo(() => {
    return [...customers]
      .sort(
        (a, b) =>
          Number(b.total_revenue || 0) -
          Number(a.total_revenue || 0)
      )
      .slice(0, 10);
  }, [customers]);

  if (loading) {
    return (
      <div className="report-card">
        <h2>Customer Analytics</h2>
        <p>Loading customer analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-card">
        <h2>Customer Analytics</h2>

        <div className="report-error">
          {error}
        </div>

        <button
          type="button"
          onClick={loadCustomerAnalytics}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="customer-analytics-report">

      <div className="report-header">
        <div>
          <h2>Customer Analytics</h2>
          <p>
            Customer purchasing behavior, segmentation
            and engagement analysis.
          </p>
        </div>

        {summary?.model_version && (
          <span className="model-badge">
            {summary.model_version}
          </span>
        )}
      </div>

      {/* KPI CARDS */}

      <div className="report-kpi-grid">

        <KpiCard
          title="Total Customers"
          value={formatNumber(
            summary?.total_customers ??
              customers.length
          )}
        />

        <KpiCard
          title="Total Revenue"
          value={formatCurrency(
            summary?.total_revenue
          )}
        />

        <KpiCard
          title="Average Order Value"
          value={formatCurrency(
            summary?.average_order_value
          )}
        />

        <KpiCard
          title="Engagement Score"
          value={formatNumber(
            summary?.average_engagement_score
          )}
        />

        <KpiCard
          title="Purchase Frequency"
          value={formatNumber(
            summary?.average_purchase_frequency_30d
          )}
        />

        <KpiCard
          title="Return Rate"
          value={formatPercentage(
            summary?.average_return_rate
          )}
        />

      </div>

      <div className="report-grid">

        {/* SEGMENTS */}

        <div className="report-card">

          <h3>Customer Segments</h3>

          <p className="report-muted">
            Distribution of customers across
            segmentation groups.
          </p>

          {segmentData.length === 0 ? (
            <p>No segment data available.</p>
          ) : (
            <div className="segment-list">

              {segmentData.map((segment) => {

                const percentage =
                  customers.length > 0
                    ? (segment.count /
                        customers.length) *
                      100
                    : 0;

                return (
                  <div
                    className="segment-row"
                    key={segment.name}
                  >

                    <div className="segment-label">
                      <strong>
                        {segment.name}
                      </strong>

                      <span>
                        {segment.count} customers
                      </span>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <span className="segment-percentage">
                      {percentage.toFixed(1)}%
                    </span>

                  </div>
                );
              })}

            </div>
          )}

        </div>

        {/* MODEL INFORMATION */}

        <div className="report-card">

          <h3>Segmentation Model</h3>

          <div className="model-info">

            <InfoRow
              label="Algorithm"
              value={
                summary?.algorithm || "K-Means"
              }
            />

            <InfoRow
              label="Model Version"
              value={
                summary?.model_version || "N/A"
              }
            />

            <InfoRow
              label="Clusters"
              value={
                summary?.cluster_count ??
                segmentData.length
              }
            />

            <InfoRow
              label="Silhouette Score"
              value={
                formatNumber(
                  summary?.silhouette_score
                )
              }
            />

            <InfoRow
              label="Training Date"
              value={
                formatDate(
                  summary?.trained_at
                )
              }
            />

          </div>

        </div>

      </div>

      {/* TOP CUSTOMERS */}

      <div className="report-card">

        <div className="report-card-header">
          <div>
            <h3>Top Customers by Revenue</h3>
            <p className="report-muted">
              Customers contributing the highest
              revenue.
            </p>
          </div>
        </div>

        <div className="report-table-wrapper">

          <table className="report-table">

            <thead>
              <tr>
                <th>Customer</th>
                <th>Segment</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th>AOV</th>
                <th>Engagement</th>
                <th>Return Rate</th>
              </tr>
            </thead>

            <tbody>

              {topCustomers.map((customer) => (
                <tr key={customer.customer_id}>

                  <td>
                    {customer.external_customer_id ||
                      customer.customer_id}
                  </td>

                  <td>
                    <span className="segment-badge">
                      {customer.segment_name ||
                        customer.segment_code ||
                        "N/A"}
                    </span>
                  </td>

                  <td>
                    {formatNumber(
                      customer.order_count
                    )}
                  </td>

                  <td>
                    {formatCurrency(
                      customer.total_revenue
                    )}
                  </td>

                  <td>
                    {formatCurrency(
                      customer.average_order_value
                    )}
                  </td>

                  <td>
                    {formatNumber(
                      customer.engagement_score
                    )}
                  </td>

                  <td>
                    {formatPercentage(
                      customer.return_rate
                    )}
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>

    </section>
  );
}


/* ----------------------------- */
/* REUSABLE COMPONENTS */
/* ----------------------------- */

function KpiCard({ title, value }) {
  return (
    <div className="report-kpi-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}


function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}


/* ----------------------------- */
/* FORMATTERS */
/* ----------------------------- */

function formatNumber(value) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "N/A";
  }

  return Number(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  );
}


function formatCurrency(value) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "N/A";
  }

  return `₹${Number(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  )}`;
}


function formatPercentage(value) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "N/A";
  }

  const number = Number(value);

  // Handles both 0.25 and 25 formats.
  const percentage =
    number <= 1 ? number * 100 : number;

  return `${percentage.toFixed(1)}%`;
}


function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleDateString(
    "en-IN"
  );
}