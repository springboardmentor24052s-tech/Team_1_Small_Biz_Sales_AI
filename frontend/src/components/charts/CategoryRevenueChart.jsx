import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

export default function CategoryRevenueChart({ data }) {

  if (!data) {
    return (
      <p className="mm-loading-tag">
        No category revenue data available.
      </p>
    );
  }

  const chartData = Object.entries(data).map(([category, revenue]) => ({
    category,
    revenue
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="category" />

        <YAxis />

        <Tooltip />

        <Bar
          dataKey="revenue"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}