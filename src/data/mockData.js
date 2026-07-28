export const MOCK_ROLES = [
  {
    id: 'owner',
    name: 'Business Owner',
    subtitle: 'Strategic Overview, Revenue & AI Growth Engine',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    badge: 'Owner Access',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
  },
  {
    id: 'manager',
    name: 'Store Manager',
    subtitle: 'Inventory Control, Low Stock Alerts & Supplier Chain',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    badge: 'Store Operations',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
  },
  {
    id: 'sales',
    name: 'Sales Executive',
    subtitle: 'Deal Pipeline, Targets & Customer Engagement',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    badge: 'Sales Rep',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
  },
  {
    id: 'admin',
    name: 'System Admin',
    subtitle: 'User Access Control, RBAC & Platform System Logs',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    badge: 'Super Admin',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
  }
];

export const MOCK_OWNER_DATA = {
  kpis: {
    totalRevenue: { value: '$148,520', change: '+18.4%', isPositive: true, timeFrame: 'vs last month' },
    totalOrders: { value: '1,842', change: '+12.1%', isPositive: true, timeFrame: 'vs last month' },
    totalCustomers: { value: '2,450', change: '+8.6%', isPositive: true, timeFrame: 'vs last month' },
    grossProfit: { value: '$42,180', change: '+14.2%', isPositive: true, timeFrame: 'vs last month' }
  },
  salesTrend: [
    { month: 'Jan', revenue: 68000, expenses: 42000, profit: 26000 },
    { month: 'Feb', revenue: 74000, expenses: 45000, profit: 29000 },
    { month: 'Mar', revenue: 89000, expenses: 48000, profit: 41000 },
    { month: 'Apr', revenue: 95000, expenses: 51000, profit: 44000 },
    { month: 'May', revenue: 112000, expenses: 58000, profit: 54000 },
    { month: 'Jun', revenue: 128000, expenses: 62000, profit: 66000 },
    { month: 'Jul', revenue: 148520, expenses: 68000, profit: 80520 }
  ],
  categoryDistribution: [
    { name: 'Electronics & Smart Gear', value: 45, color: '#4f46e5' },
    { name: 'Office Equipment', value: 25, color: '#06b6d4' },
    { name: 'POS & Peripherals', value: 18, color: '#10b981' },
    { name: 'Software Licenses', value: 12, color: '#f59e0b' }
  ],
  topProducts: [
    { name: 'AI POS Terminal X1', sales: 420, revenue: '$63,000', growth: '+24%' },
    { name: 'Wireless Thermal Printer', sales: 310, revenue: '$27,900', growth: '+18%' },
    { name: 'Smart Barcode Scanner', sales: 280, revenue: '$22,400', growth: '+12%' },
    { name: 'Cloud Retail Pro License', sales: 210, revenue: '$18,900', growth: '+30%' }
  ],
  aiRecommendations: [
    {
      id: 1,
      title: 'Stock Reorder Recommendation',
      description: 'Predictive analytics forecast 35% higher demand for AI POS Terminal X1 next month due to holiday retail rush.',
      impact: 'High Impact (+ $12.4k Est. Revenue)',
      type: 'warning',
      actionLabel: 'Generate Supplier PO'
    },
    {
      id: 2,
      title: 'Customer Retargeting Opportunity',
      description: '142 recurring business accounts have not ordered in 45 days. AI suggests automated promotional workflow.',
      impact: 'Medium Impact ($6.8k Retention)',
      type: 'insight',
      actionLabel: 'Launch Email Campaign'
    },
    {
      id: 3,
      title: 'Pricing Optimization Signal',
      description: 'Margin analysis indicates high price elasticity for Wireless Thermal Printer. A 4.5% price bump will maximize profit without reducing sales volume.',
      impact: 'Immediate Margin Boost (+ $2.1k)',
      type: 'success',
      actionLabel: 'Apply Price Adjustment'
    }
  ]
};

export const MOCK_MANAGER_DATA = {
  kpis: {
    totalSKUs: { value: '1,240 SKUs', change: '+32 new', isPositive: true },
    lowStockItems: { value: '14 Items', change: 'Action Required', isPositive: false },
    outOfStock: { value: '3 Items', change: 'Critical Alert', isPositive: false },
    pendingOrders: { value: '6 Orders', change: 'In Transit', isPositive: true }
  },
  lowStockAlerts: [
    { id: 'SKU-902', name: 'Thermal Receipt Paper (Box of 50)', currentStock: 4, minStock: 25, supplier: 'Papyrus Tech Ltd', leadTime: '2 Days' },
    { id: 'SKU-441', name: 'Bluetooth Barcode Scanner HD', currentStock: 2, minStock: 15, supplier: 'OptiScan Systems', leadTime: '4 Days' },
    { id: 'SKU-108', name: 'USB-C Heavy Duty Cash Drawer', currentStock: 1, minStock: 10, supplier: 'SecureVault Hardware', leadTime: '3 Days' },
    { id: 'SKU-882', name: '10.5-inch Tablet Stand (Black)', currentStock: 3, minStock: 20, supplier: 'ErgoGear Co', leadTime: '5 Days' }
  ],
  inventoryItems: [
    { id: 'SKU-902', name: 'Thermal Receipt Paper', category: 'Supplies', stock: 4, unitPrice: '$45.00', status: 'Low Stock', supplier: 'Papyrus Tech' },
    { id: 'SKU-441', name: 'Bluetooth Barcode Scanner', category: 'Hardware', stock: 2, unitPrice: '$129.00', status: 'Critical', supplier: 'OptiScan' },
    { id: 'SKU-108', name: 'Heavy Duty Cash Drawer', category: 'Hardware', stock: 1, unitPrice: '$189.00', status: 'Critical', supplier: 'SecureVault' },
    { id: 'SKU-501', name: 'AI POS Terminal X1', category: 'Terminals', stock: 68, unitPrice: '$499.00', status: 'In Stock', supplier: 'NextGen POS' },
    { id: 'SKU-312', name: 'Dual Screen Customer Display', category: 'Terminals', stock: 45, unitPrice: '$299.00', status: 'In Stock', supplier: 'NextGen POS' },
    { id: 'SKU-774', name: 'Cloud Router Enterprise', category: 'Networking', stock: 32, unitPrice: '$149.00', status: 'In Stock', supplier: 'NetPulse Corp' },
    { id: 'SKU-602', name: 'Label Roll Sticker Pack', category: 'Supplies', stock: 120, unitPrice: '$18.00', status: 'In Stock', supplier: 'Papyrus Tech' }
  ],
  suppliers: [
    { name: 'NextGen POS Systems', itemsSupplied: 12, rating: '4.9 ★', deliveryStatus: 'On Time (98%)' },
    { name: 'OptiScan Electronics', itemsSupplied: 8, rating: '4.7 ★', deliveryStatus: 'Minor Delays (92%)' },
    { name: 'Papyrus Tech Supplies', itemsSupplied: 15, rating: '4.8 ★', deliveryStatus: 'On Time (99%)' }
  ]
};

export const MOCK_SALES_DATA = {
  kpis: {
    monthlyTarget: { value: '$45,000 / $50,000', percentage: '90%', isPositive: true },
    closedDeals: { value: '34 Deals', change: '+6 this week', isPositive: true },
    pipelineValue: { value: '$124,800', change: '18 Active Leads', isPositive: true },
    winRate: { value: '68.4%', change: '+4.2% vs avg', isPositive: true }
  },
  pipelineStages: [
    { stage: 'New Prospect', count: 12, value: '$42,000', color: 'border-blue-500' },
    { stage: 'Demo Scheduled', count: 8, value: '$34,500', color: 'border-indigo-500' },
    { stage: 'Proposal Sent', count: 5, value: '$28,000', color: 'border-amber-500' },
    { stage: 'Closing Stage', count: 3, value: '$20,300', color: 'border-emerald-500' }
  ],
  recentLeads: [
    { name: 'Apex Logistics Inc', contact: 'Marcus Vance', amount: '$14,500', stage: 'Proposal Sent', aiProbability: '88% AI Win Score', priority: 'High' },
    { name: 'BlueHorizon Cafe Chain', contact: 'Sarah Jenkins', amount: '$8,200', stage: 'Closing Stage', aiProbability: '94% AI Win Score', priority: 'High' },
    { name: 'Urban Style Outlets', contact: 'David Kim', amount: '$18,000', stage: 'Demo Scheduled', aiProbability: '72% AI Win Score', priority: 'Medium' },
    { name: 'Metro Health Pharmacy', contact: 'Dr. Elena Rostova', amount: '$22,500', stage: 'New Prospect', aiProbability: '65% AI Win Score', priority: 'Medium' },
    { name: 'GreenBite Organics', contact: 'Liam O\'Connor', amount: '$6,400', stage: 'Proposal Sent', aiProbability: '82% AI Win Score', priority: 'High' }
  ],
  dailyAchievement: [
    { day: 'Mon', target: 2000, achieved: 2400 },
    { day: 'Tue', target: 2000, achieved: 1900 },
    { day: 'Wed', target: 2000, achieved: 3100 },
    { day: 'Thu', target: 2000, achieved: 2800 },
    { day: 'Fri', target: 2000, achieved: 3500 }
  ]
};

export const MOCK_ADMIN_DATA = {
  systemMetrics: {
    apiLatency: '38 ms',
    cpuUsage: '14%',
    memoryUsage: '3.4 GB / 8 GB',
    uptime: '99.99%',
    activeSessions: 142
  },
  users: [
    { id: 'USR-101', name: 'Eleanor Vance', email: 'owner@business.com', role: 'Business Owner', status: 'Active', lastLogin: '2 mins ago', mfa: 'Enabled' },
    { id: 'USR-102', name: 'Robert Chen', email: 'manager@store.com', role: 'Store Manager', status: 'Active', lastLogin: '14 mins ago', mfa: 'Enabled' },
    { id: 'USR-103', name: 'Sophia Martinez', email: 'sales@team.com', role: 'Sales Executive', status: 'Active', lastLogin: '1 hour ago', mfa: 'Disabled' },
    { id: 'USR-104', name: 'Alexander Wright', email: 'admin@system.com', role: 'System Admin', status: 'Active', lastLogin: 'Just now', mfa: 'Enabled' },
    { id: 'USR-105', name: 'Daniel Craig', email: 'daniel.c@store.com', role: 'Sales Executive', status: 'Inactive', lastLogin: '3 days ago', mfa: 'Disabled' }
  ],
  rbacMatrix: [
    { feature: 'View Financial Dashboard', owner: true, manager: false, sales: false, admin: true },
    { feature: 'Manage Inventory & Stock', owner: true, manager: true, sales: false, admin: true },
    { feature: 'Create & Close Deals', owner: true, manager: false, sales: true, admin: true },
    { feature: 'User Management & Roles', owner: false, manager: false, sales: false, admin: true },
    { feature: 'Export Financial Reports', owner: true, manager: false, sales: false, admin: true },
    { feature: 'View Audit & System Logs', owner: true, manager: false, sales: false, admin: true }
  ],
  systemLogs: [
    { id: 'LOG-991', timestamp: '17:18:44', user: 'admin@system.com', action: 'ROLE_PERMISSION_UPDATE', level: 'INFO', details: 'Updated Store Manager stock reorder threshold' },
    { id: 'LOG-990', timestamp: '17:14:12', user: 'system_ai_engine', action: 'PREDICTIVE_MODEL_TRAIN', level: 'SUCCESS', details: 'Automated sales forecasting model re-indexed with +1,240 records' },
    { id: 'LOG-989', timestamp: '16:55:01', user: 'sales@team.com', action: 'DEAL_STAGE_CHANGE', level: 'INFO', details: 'Moved BlueHorizon Cafe to Closing Stage ($8,200)' },
    { id: 'LOG-988', timestamp: '16:30:22', user: 'manager@store.com', action: 'LOW_STOCK_TRIGGER', level: 'WARNING', details: 'Stock alert generated for SKU-902 (4 remaining)' },
    { id: 'LOG-987', timestamp: '15:10:05', user: 'unknown_ip_192.168.1.1', action: 'FAILED_AUTH_ATTEMPT', level: 'DANGER', details: 'Invalid password attempt for account admin@system.com' }
  ]
};

export const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'Low Stock Alert!', message: 'Thermal Receipt Paper is down to 4 units.', time: '10m ago', unread: true, type: 'warning' },
  { id: 2, title: 'AI Prediction Match', message: 'Apex Logistics deal win score increased to 88%.', time: '1h ago', unread: true, type: 'insight' },
  { id: 3, title: 'Monthly Revenue Goal Met', message: 'Business achieved 100% of July revenue target!', time: '3h ago', unread: false, type: 'success' }
];

export const MOCK_CUSTOMERS = [
  { id: 'CUST-001', name: 'Apex Logistics Inc', tier: 'Enterprise Platinum', lifetimeValue: '$142,500', lastPurchase: '2026-07-24', status: 'Active', churnRisk: 'Low (12%)' },
  { id: 'CUST-002', name: 'BlueHorizon Cafe Chain', tier: 'Gold Tier', lifetimeValue: '$68,400', lastPurchase: '2026-07-26', status: 'Active', churnRisk: 'Low (8%)' },
  { id: 'CUST-003', name: 'Urban Style Outlets', tier: 'Gold Tier', lifetimeValue: '$52,100', lastPurchase: '2026-06-18', status: 'Needs Followup', churnRisk: 'Medium (42%)' },
  { id: 'CUST-004', name: 'Metro Health Pharmacy', tier: 'Silver Tier', lifetimeValue: '$28,900', lastPurchase: '2026-07-10', status: 'Active', churnRisk: 'Low (15%)' },
  { id: 'CUST-005', name: 'GreenBite Organics', tier: 'Silver Tier', lifetimeValue: '$19,800', lastPurchase: '2026-07-02', status: 'Active', churnRisk: 'Low (10%)' }
];
