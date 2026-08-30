import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

/*
 * IMPORTANT:
 * Change this ONE value if your friend's backend
 * uses a different demand forecasting endpoint.
 */
const DEMAND_FORECAST_ENDPOINT =
  "/forecast/demand";

export default function DemandForecastReport() {

  const [data, setData] = useState({
    historical: [],
    forecast: [],
  });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadDemandForecast();
  }, []);

  async function loadDemandForecast() {

    try {

      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}${DEMAND_FORECAST_ENDPOINT}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load demand forecast."
        );
      }

      const result =
        await response.json();

      setData({
        historical:
          result.historical || [],
        forecast:
          result.forecast || [],
      });

    } catch (err) {

      setError(
        err.message ||
          "Failed to load demand forecast."
      );

    } finally {

      setLoading(false);

    }
  }

  const forecastSummary = useMemo(() => {

    const forecast = data.forecast;

    if (!forecast.length) {
      return {
        total: 0,
        average: 0,
        highest: 0,
      };
    }

    const values = forecast.map(
      (item) =>
        Number(
          item.predicted ??
          item.predicted_quantity ??
          item.predicted_demand ??
          0
        )
    );

    return {
      total: values.reduce(
        (sum, value) =>
          sum + value,
        0
      ),

      average:
        values.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / values.length,

      highest:
        Math.max(...values),
    };

  }, [data.forecast]);

  if (loading) {

    return (
      <div className="report-card">
        <h2>Demand Forecast</h2>
        <p>
          Loading demand forecast...
        </p>
      </div>
    );

  }

  if (error) {

    return (
      <div className="report-card">

        <h2>Demand Forecast</h2>

        <div className="report-error">
          {error}
        </div>

        <button
          type="button"
          onClick={loadDemandForecast}
        >
          Retry
        </button>

      </div>
    );

  }

  return (

    <section className="demand-forecast-report">

      <div className="report-header">

        <div>

          <h2>
            Demand Forecast
          </h2>

          <p>
            Predicted future product demand
            based on historical sales data.
          </p>

        </div>

        <span className="model-badge">
          AI Forecast
        </span>

      </div>


      {/* FORECAST KPIs */}

      <div className="report-kpi-grid">

        <KpiCard
          title="Forecast Periods"
          value={data.forecast.length}
        />

        <KpiCard
          title="Forecast Demand"
          value={formatNumber(
            forecastSummary.total
          )}
        />

        <KpiCard
          title="Average Demand"
          value={formatNumber(
            forecastSummary.average
          )}
        />

        <KpiCard
          title="Peak Forecast"
          value={formatNumber(
            forecastSummary.highest
          )}
        />

      </div>


      {/* FORECAST TABLE */}

      <div className="report-card">

        <div className="report-card-header">

          <div>

            <h3>
              Demand Forecast
            </h3>

            <p className="report-muted">
              Expected future demand.
            </p>

          </div>

        </div>


        {data.forecast.length === 0 ? (

          <p>
            No forecast data available.
          </p>

        ) : (

          <div className="report-table-wrapper">

            <table className="report-table">

              <thead>

                <tr>
                  <th>Date</th>
                  <th>Predicted Demand</th>
                  <th>Status</th>
                </tr>

              </thead>

              <tbody>

                {data.forecast.map(
                  (item, index) => {

                    const value =
                      Number(
                        item.predicted ??
                        item.predicted_quantity ??
                        item.predicted_demand ??
                        0
                      );

                    const previous =
                      index > 0
                        ? Number(
                            data.forecast[
                              index - 1
                            ].predicted ??
                            data.forecast[
                              index - 1
                            ].predicted_quantity ??
                            data.forecast[
                              index - 1
                            ].predicted_demand ??
                            0
                          )
                        : null;

                    let status = "Stable";

                    if (
                      previous !== null &&
                      value > previous
                    ) {
                      status = "Increasing";
                    }

                    if (
                      previous !== null &&
                      value < previous
                    ) {
                      status = "Decreasing";
                    }

                    return (
                      <tr key={index}>

                        <td>
                          {item.date ||
                            item.period ||
                            item.forecast_date ||
                            "N/A"}
                        </td>

                        <td>
                          {formatNumber(value)}
                        </td>

                        <td>

                          <span
                            className={`forecast-status ${status
                              .toLowerCase()
                              .replace(
                                " ",
                                "-"
                              )}`}
                          >
                            {status}
                          </span>

                        </td>

                      </tr>
                    );

                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* SIMPLE FORECAST VISUALIZATION */}

      <div className="report-card">

        <h3>
          Forecast Trend
        </h3>

        <p className="report-muted">
          Visual representation of predicted
          demand across the forecast period.
        </p>

        <div className="forecast-bars">

          {data.forecast.map(
            (item, index) => {

              const value =
                Number(
                  item.predicted ??
                  item.predicted_quantity ??
                  item.predicted_demand ??
                  0
                );

              const maxValue =
                forecastSummary.highest ||
                1;

              const height =
                Math.max(
                  5,
                  (value / maxValue) * 100
                );

              return (
                <div
                  className="forecast-bar-column"
                  key={index}
                >

                  <div
                    className="forecast-bar"
                    style={{
                      height: `${height}%`,
                    }}
                    title={`${formatNumber(
                      value
                    )}`}
                  />

                  <span>
                    {item.date ||
                      item.period ||
                      index + 1}
                  </span>

                </div>
              );

            }
          )}

        </div>

      </div>

    </section>

  );
}


function KpiCard({ title, value }) {

  return (

    <div className="report-kpi-card">

      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

    </div>

  );
}


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