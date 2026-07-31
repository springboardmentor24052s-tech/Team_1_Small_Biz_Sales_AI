import client from './client';

// GET /kpi -> { "Total Revenue", "Total Orders", "Average Order Value", "Total Quantity Sold" }
export async function getKpis() {
  const { data } = await client.get('/kpi');
  return data;
}

// GET /sales-trend -> { "January": 12345.6, "February": 9800, ... } (plain dict, not an array)
export async function getSalesTrend() {
  const { data } = await client.get('/sales-trend');
  return data;
}

// GET /top-category -> { "Top Selling Category", "Quantity Sold", "Category Wise Sales": {cat: qty} }
export async function getTopCategory() {
  const { data } = await client.get('/top-category');
  return data;
}

// GET /state-revenue -> { "Highest Revenue State", "Revenue", "State Wise Revenue": {state: revenue} }
export async function getStateRevenue() {
  const { data } = await client.get('/state-revenue');
  return data;
}

// GET /category-revenue -> { "Highest Revenue Category", "Revenue", "Category Wise Revenue": {cat: revenue} }
export async function getCategoryRevenue() {
  const { data } = await client.get('/category-revenue');
  return data;
}

// POST /predict expects the full SalesInput feature payload (label-encoded
// values matching the training pipeline). Returns { "Predicted Sales Amount": number }.
export async function predictSales(payload) {
  const { data } = await client.post('/predict', payload);
  return data;
}

// Role-gated dashboards — each just returns { message, user }. The real
// per-role content on these pages comes from the shared /kpi + chart
// endpoints above, since those aren't role-restricted in this backend.
export async function getAdminDashboard() {
  const { data } = await client.get('/admin-dashboard');
  return data;
}
export async function getOwnerDashboard() {
  const { data } = await client.get('/owner-dashboard');
  return data;
}
export async function getManagerDashboard() {
  const { data } = await client.get('/manager-dashboard');
  return data;
}
export async function getSalesDashboard() {
  const { data } = await client.get('/sales-dashboard');
  return data;
}
