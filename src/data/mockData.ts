// Central mock data store for MarketMind AI

export const monthlySales = [
  { month: 'Jan', revenue: 142000, profit: 42000, orders: 1240, target: 130000 },
  { month: 'Feb', revenue: 158000, profit: 48000, orders: 1380, target: 145000 },
  { month: 'Mar', revenue: 175000, profit: 53000, orders: 1520, target: 160000 },
  { month: 'Apr', revenue: 163000, profit: 49000, orders: 1420, target: 165000 },
  { month: 'May', revenue: 192000, profit: 61000, orders: 1670, target: 180000 },
  { month: 'Jun', revenue: 218000, profit: 72000, orders: 1890, target: 200000 },
  { month: 'Jul', revenue: 204000, profit: 66000, orders: 1780, target: 205000 },
  { month: 'Aug', revenue: 231000, profit: 76000, orders: 2010, target: 215000 },
  { month: 'Sep', revenue: 247000, profit: 82000, orders: 2150, target: 230000 },
  { month: 'Oct', revenue: 268000, profit: 91000, orders: 2330, target: 250000 },
  { month: 'Nov', revenue: 312000, profit: 107000, orders: 2720, target: 290000 },
  { month: 'Dec', revenue: 356000, profit: 124000, orders: 3100, target: 330000 },
]

export const forecastData = [
  { month: 'Oct', actual: 268000, forecast: null, upper: null, lower: null },
  { month: 'Nov', actual: 312000, forecast: null, upper: null, lower: null },
  { month: 'Dec', actual: null, forecast: 345000, upper: 378000, lower: 312000 },
  { month: 'Jan', actual: null, forecast: 298000, upper: 335000, lower: 261000 },
  { month: 'Feb', actual: null, forecast: 321000, upper: 362000, lower: 280000 },
  { month: 'Mar', actual: null, forecast: 368000, upper: 415000, lower: 321000 },
]

export const categoryData = [
  { name: 'Electronics', value: 34, color: '#2563eb' },
  { name: 'Apparel', value: 22, color: '#4f46e5' },
  { name: 'Home & Garden', value: 18, color: '#22c55e' },
  { name: 'Sports', value: 14, color: '#f59e0b' },
  { name: 'Beauty', value: 12, color: '#ef4444' },
]

export const topProducts = [
  { id: 'P001', name: 'Wireless Noise-Cancelling Headphones', category: 'Electronics', units: 4820, revenue: 867600, growth: 23.4, stock: 142 },
  { id: 'P002', name: 'Premium Running Shoes', category: 'Sports', units: 3640, revenue: 546000, growth: 18.2, stock: 89 },
  { id: 'P003', name: 'Smart Home Hub Pro', category: 'Electronics', units: 2910, revenue: 523800, growth: 31.7, stock: 56 },
  { id: 'P004', name: 'Organic Skincare Set', category: 'Beauty', units: 5200, revenue: 468000, growth: 12.8, stock: 210 },
  { id: 'P005', name: 'Ergonomic Office Chair', category: 'Home & Garden', units: 1840, revenue: 441600, growth: -4.2, stock: 34 },
  { id: 'P006', name: 'Yoga Mat Premium', category: 'Sports', units: 6100, revenue: 305000, growth: 9.1, stock: 178 },
]

export const recentTransactions = [
  { id: 'TXN-8841', customer: 'Sarah Mitchell', amount: 1249.99, status: 'completed', date: '2026-07-24', method: 'Visa •••4821' },
  { id: 'TXN-8840', customer: 'James Okonkwo', amount: 549.00, status: 'pending', date: '2026-07-24', method: 'PayPal' },
  { id: 'TXN-8839', customer: 'Priya Sharma', amount: 89.99, status: 'completed', date: '2026-07-23', method: 'Mastercard •••7734' },
  { id: 'TXN-8838', customer: 'Lucas Ferreira', amount: 2340.00, status: 'completed', date: '2026-07-23', method: 'Bank Transfer' },
  { id: 'TXN-8837', customer: 'Mei Tanaka', amount: 199.50, status: 'refunded', date: '2026-07-22', method: 'Visa •••2201' },
  { id: 'TXN-8836', customer: 'Omar Al-Hassan', amount: 478.25, status: 'failed', date: '2026-07-22', method: 'Amex •••9988' },
]

export const customerSegments = [
  { segment: 'Champions', count: 1240, value: 2840000, color: '#2563eb', pct: 24 },
  { segment: 'Loyal', count: 1890, value: 1920000, color: '#4f46e5', pct: 37 },
  { segment: 'At Risk', count: 820, value: 680000, color: '#f59e0b', pct: 16 },
  { segment: 'Lost', count: 340, value: 120000, color: '#ef4444', pct: 7 },
  { segment: 'New', count: 820, value: 410000, color: '#22c55e', pct: 16 },
]

export const churnRiskData = [
  { name: 'Low Risk', value: 58, color: '#22c55e' },
  { name: 'Medium Risk', value: 27, color: '#f59e0b' },
  { name: 'High Risk', value: 15, color: '#ef4444' },
]

export const clvData = [
  { cohort: 'Jan 25', clv: 1240, retention: 82 },
  { cohort: 'Feb 25', clv: 1380, retention: 79 },
  { cohort: 'Mar 25', clv: 1520, retention: 84 },
  { cohort: 'Apr 25', clv: 1290, retention: 76 },
  { cohort: 'May 25', clv: 1640, retention: 88 },
  { cohort: 'Jun 25', clv: 1810, retention: 91 },
]

export const inventoryItems = [
  { id: 'SKU-001', name: 'Wireless Headphones XB900N', category: 'Electronics', stock: 142, reorder: 50, value: 25560, status: 'ok', movement: '+24' },
  { id: 'SKU-002', name: 'Running Shoes Air Max', category: 'Sports', stock: 34, reorder: 40, value: 5100, status: 'low', movement: '-18' },
  { id: 'SKU-003', name: 'Smart Home Hub Pro', category: 'Electronics', stock: 8, reorder: 25, value: 1440, status: 'critical', movement: '-42' },
  { id: 'SKU-004', name: 'Organic Rose Serum', category: 'Beauty', stock: 210, reorder: 60, value: 8400, status: 'ok', movement: '+12' },
  { id: 'SKU-005', name: 'Ergonomic Office Chair', category: 'Furniture', stock: 22, reorder: 30, value: 5280, status: 'low', movement: '-8' },
  { id: 'SKU-006', name: 'Yoga Mat Premium 6mm', category: 'Sports', stock: 178, reorder: 50, value: 8900, status: 'ok', movement: '+31' },
  { id: 'SKU-007', name: 'Bamboo Cutting Board Set', category: 'Home', stock: 0, reorder: 20, value: 0, status: 'out', movement: '-20' },
]

export const anomalies = [
  { id: 'ANM-001', type: 'fraud', title: 'Unusual card activity', desc: '14 transactions from same IP in 2 hours', severity: 'critical', time: '10 min ago', product: 'Electronics' },
  { id: 'ANM-002', type: 'sales', title: 'Sales spike detected', desc: 'Running Shoes up 340% above baseline', severity: 'info', time: '1 hr ago', product: 'Sports' },
  { id: 'ANM-003', type: 'inventory', title: 'Stock depletion alert', desc: 'Smart Hub Pro will stock out in ~6 hours', severity: 'high', time: '2 hr ago', product: 'Electronics' },
  { id: 'ANM-004', type: 'fraud', title: 'Account takeover attempt', desc: 'Credential stuffing pattern on customer portal', severity: 'critical', time: '3 hr ago', product: 'N/A' },
  { id: 'ANM-005', type: 'sales', title: 'Revenue dip — Beauty', desc: 'Beauty category down 28% vs 7-day avg', severity: 'medium', time: '5 hr ago', product: 'Beauty' },
]

export const invoices = [
  { id: 'INV-2024-0841', customer: 'Apex Retail Group', amount: 14280.00, status: 'paid', due: '2026-07-15', issued: '2026-07-01', items: 12 },
  { id: 'INV-2024-0840', customer: 'Momentum Sports LLC', amount: 8650.50, status: 'pending', due: '2026-07-31', issued: '2026-07-10', items: 7 },
  { id: 'INV-2024-0839', customer: 'Vertex Beauty Inc.', amount: 3200.00, status: 'overdue', due: '2026-07-08', issued: '2026-06-24', items: 4 },
  { id: 'INV-2024-0838', customer: 'NovaTech Electronics', amount: 52400.00, status: 'paid', due: '2026-07-20', issued: '2026-07-05', items: 28 },
  { id: 'INV-2024-0837', customer: 'GreenLeaf Home Co.', amount: 1840.00, status: 'draft', due: '2026-08-05', issued: '2026-07-24', items: 3 },
  { id: 'INV-2024-0836', customer: 'Swift Commerce Ltd.', amount: 9720.75, status: 'pending', due: '2026-08-01', issued: '2026-07-15', items: 9 },
]

export const users = [
  { id: 1, name: 'Patricia Chen', email: 'p.chen@marketmind.ai', role: 'Business Owner', status: 'active', lastLogin: '2 min ago', avatar: 'PC' },
  { id: 2, name: 'Marcus Williams', email: 'm.williams@marketmind.ai', role: 'Administrator', status: 'active', lastLogin: '1 hr ago', avatar: 'MW' },
  { id: 3, name: 'Sofia Alvarez', email: 's.alvarez@marketmind.ai', role: 'Store Manager', status: 'active', lastLogin: '3 hr ago', avatar: 'SA' },
  { id: 4, name: 'David Osei', email: 'd.osei@marketmind.ai', role: 'Sales Executive', status: 'active', lastLogin: 'Yesterday', avatar: 'DO' },
  { id: 5, name: 'Yuki Nakamura', email: 'y.nakamura@marketmind.ai', role: 'Sales Executive', status: 'inactive', lastLogin: '5 days ago', avatar: 'YN' },
  { id: 6, name: 'Aisha Patel', email: 'a.patel@marketmind.ai', role: 'Store Manager', status: 'active', lastLogin: '12 hr ago', avatar: 'AP' },
]

export const weeklyData = [
  { day: 'Mon', revenue: 42000, orders: 310 },
  { day: 'Tue', revenue: 38000, orders: 285 },
  { day: 'Wed', revenue: 51000, orders: 372 },
  { day: 'Thu', revenue: 47000, orders: 341 },
  { day: 'Fri', revenue: 63000, orders: 458 },
  { day: 'Sat', revenue: 71000, orders: 512 },
  { day: 'Sun', revenue: 44000, orders: 320 },
]

export const regionalData = [
  { region: 'Northeast', revenue: 842000, growth: 18.4, orders: 7240 },
  { region: 'Southeast', revenue: 614000, growth: 12.1, orders: 5410 },
  { region: 'Midwest', revenue: 521000, growth: 24.8, orders: 4520 },
  { region: 'Southwest', revenue: 389000, growth: 9.3, orders: 3380 },
  { region: 'West Coast', revenue: 1024000, growth: 31.2, orders: 8810 },
  { region: 'Mountain', revenue: 241000, growth: 16.7, orders: 2110 },
]

export const recommendationProducts = [
  { id: 'R001', name: 'AirPods Pro 2nd Gen', category: 'Electronics', confidence: 94, type: 'cross-sell', expectedRevenue: 48600, lift: 2.8 },
  { id: 'R002', name: 'Nike Dri-FIT Training Set', category: 'Sports', confidence: 87, type: 'upsell', expectedRevenue: 31200, lift: 2.1 },
  { id: 'R003', name: 'Hydration Running Pack', category: 'Sports', confidence: 91, type: 'frequently-bought', expectedRevenue: 22400, lift: 3.4 },
  { id: 'R004', name: 'Smart Watch Ultra', category: 'Electronics', confidence: 78, type: 'upsell', expectedRevenue: 67800, lift: 1.9 },
  { id: 'R005', name: 'Vitamin C Serum Deluxe', category: 'Beauty', confidence: 83, type: 'cross-sell', expectedRevenue: 18900, lift: 2.5 },
  { id: 'R006', name: 'Posture Corrector Pro', category: 'Health', confidence: 76, type: 'frequently-bought', expectedRevenue: 14200, lift: 2.2 },
]
