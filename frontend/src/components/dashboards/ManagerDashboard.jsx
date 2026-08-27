import React, { useEffect, useState } from 'react';
import { MOCK_MANAGER_DATA } from '../../data/mockData';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  AlertTriangle,
  XCircle,
  Truck,
  PlusCircle,
  RefreshCw,
  Search,
  Building2,
  CheckCircle2,
  Boxes,
  PackageCheck,
  Download,
  Mail,
  FileText
} from 'lucide-react';

export const ManagerDashboard = () => {
  const { profile } = useAuth();
  const { addToast } = useToast();
  const { inventorySummary, inventoryItems: liveInventoryItems, refresh } = useData();
  const { kpis: mockKpis, suppliers } = MOCK_MANAGER_DATA;

  const [selectedPoItem, setSelectedPoItem] = useState(null);
  const [poQuantity, setPoQuantity] = useState('50');
  const [poSupplier, setPoSupplier] = useState('Primary Wholesaler Ltd');
  const [inventoryView, setInventoryView] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  const stockAlertsEnabled = profile?.preferences?.stock_alerts_enabled ?? true;
  const alertNames = liveInventoryItems
    .filter((item) => item.stock_status !== 'in_stock')
    .slice(0, 2)
    .map((item) => item.product.sku)
    .join(' and ');

  const inventoryItems = liveInventoryItems.map((item) => ({
    id: item.product.sku,
    name: item.product.name,
    category: item.product.category || 'Uncategorized',
    stock: item.stock_quantity,
    unitPriceNum: item.product.unit_price || 199.0,
    unitPrice: item.product.unit_price ? `₹${Number(item.product.unit_price).toLocaleString('en-IN')}` : '₹199.00',
    status: item.stock_status.replaceAll('_', ' '),
    rawStatus: item.stock_status,
    supplier: 'Primary Wholesaler Ltd'
  }));

  const lowStockAlerts = liveInventoryItems
    .filter((item) => item.stock_status !== 'in_stock')
    .slice(0, 8)
    .map((item) => ({
      id: item.product.sku,
      name: item.product.name,
      currentStock: item.stock_quantity,
      minStock: item.reorder_level || 10,
      unitPriceNum: item.product.unit_price || 199.0,
      supplier: 'Primary Wholesaler Ltd',
      leadTime: '3-5 Business Days'
    }));

  const filteredItems = inventoryItems.filter((item) => {
    if (inventoryView === 'low_stock' && item.rawStatus !== 'low_stock') return false;
    if (inventoryView === 'out_of_stock' && item.rawStatus !== 'out_of_stock') return false;
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase();
    return (
      item.id.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });

  const kpis = {
    ...mockKpis,
    totalSKUs: {
      ...mockKpis.totalSKUs,
      value: inventorySummary ? `${inventorySummary.product_count} SKUs` : mockKpis.totalSKUs.value,
      change: inventorySummary ? `${inventorySummary.total_units} units` : mockKpis.totalSKUs.change
    },
    lowStockItems: {
      ...mockKpis.lowStockItems,
      value: inventorySummary ? `${inventorySummary.low_stock_count} Items` : mockKpis.lowStockItems.value
    },
    outOfStock: {
      ...mockKpis.outOfStock,
      value: inventorySummary ? `${inventorySummary.out_of_stock_count} Items` : mockKpis.outOfStock.value
    }
  };

  const handleOpenPoModal = (item) => {
    setSelectedPoItem(item || inventoryItems[0] || {
      id: 'AN210',
      name: 'AI POS Terminal X1',
      currentStock: 3,
      minStock: 10,
      unitPriceNum: 499,
      supplier: 'Primary Wholesaler Ltd'
    });
    setPoQuantity('50');
  };

  const handleDownloadPoCsv = () => {
    if (!selectedPoItem) return;
    const qty = Number(poQuantity) || 50;
    const totalVal = qty * (selectedPoItem.unitPriceNum || 199);
    const csvContent = `PURCHASE ORDER,PO-2026-${Math.floor(1000 + Math.random() * 9000)}\n` +
      `Date,${new Date().toISOString().slice(0, 10)}\n` +
      `Supplier,${poSupplier}\n` +
      `SKU,Product Name,Quantity,Unit Price (INR),Total Value (INR)\n` +
      `"${selectedPoItem.id}","${selectedPoItem.name}",${qty},${selectedPoItem.unitPriceNum || 199},${totalVal}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PurchaseOrder_${selectedPoItem.id}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    addToast(`Purchase Order CSV generated for ${selectedPoItem.id}!`, 'success');
    setSelectedPoItem(null);
  };

  const handleEmailPoSupplier = () => {
    if (!selectedPoItem) return;
    const qty = Number(poQuantity) || 50;
    const totalVal = qty * (selectedPoItem.unitPriceNum || 199);
    const subject = `Purchase Order Request: ${selectedPoItem.name} (${selectedPoItem.id})`;
    const body = `Dear ${poSupplier} Sales Team,\n\n` +
      `Please issue a Purchase Order for the following restocking order:\n\n` +
      `Product SKU: ${selectedPoItem.id}\n` +
      `Product Name: ${selectedPoItem.name}\n` +
      `Requested Reorder Quantity: ${qty} units\n` +
      `Estimated Order Value: ₹${totalVal.toLocaleString('en-IN')}\n\n` +
      `Please confirm receipt and expected delivery schedule.\n\n` +
      `Regards,\n` +
      `Store Inventory Manager\n` +
      `MarketMind AI Workspace`;

    window.location.href = `mailto:orders@${poSupplier.toLowerCase().replace(/[^a-z0-9]/g, '')}.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    addToast(`Opened supplier email dispatch for ${selectedPoItem.id}`, 'info');
    setSelectedPoItem(null);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Alert Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border border-rose-500/30 text-slate-100 shadow-xl gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Stock Alert ({kpis.lowStockItems.value})
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Store Manager Operations Dashboard</h2>
          <p className="text-xs text-rose-200/80 font-medium">
            {stockAlertsEnabled
              ? `${alertNames || 'Multiple SKUs'} are currently below the configured safety stock threshold.`
              : 'Stock risk notifications and priority queue are hidden by saved preference.'}
          </p>
        </div>

        <Button
          variant="danger"
          size="md"
          icon={PlusCircle}
          onClick={() => handleOpenPoModal(null)}
          className="shrink-0 font-bold shadow-lg shadow-rose-600/30"
        >
          Create Purchase Order
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Total Active SKUs</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.totalSKUs.value}</h3>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{kpis.totalSKUs.change}</span>
          </div>
        </Card>

        <Card hoverEffect className="border-amber-200 dark:border-amber-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Low Stock Alert</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.lowStockItems.value}</h3>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Action Required</span>
          </div>
        </Card>

        <Card hoverEffect className="border-rose-200 dark:border-rose-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Out of Stock</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.outOfStock.value}</h3>
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Critical Alert</span>
          </div>
        </Card>

        <Card hoverEffect className="border-blue-200 dark:border-blue-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Pending Shipments</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">3 Active POs</h3>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">₹18,500 In Transit</span>
          </div>
        </Card>
      </div>

      {/* Low Stock Urgent Callout Cards */}
      {stockAlertsEnabled && (
        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <CardTitle>Low Stock Priority Queue</CardTitle>
                <CardDescription>Items below minimum safety stock requirement</CardDescription>
              </div>
            </div>
          </CardHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lowStockAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm hover:border-amber-400 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{alert.name}</span>
                    <Badge variant="danger" size="sm">{alert.id}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Current: <strong className="text-rose-600 dark:text-rose-400">{alert.currentStock} units</strong> (Min: {alert.minStock})
                  </p>
                  <p className="text-[11px] text-slate-400">Supplier: {alert.supplier} • Lead time: {alert.leadTime}</p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenPoModal(alert)}
                  className="shrink-0 font-semibold"
                >
                  Generate PO
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Inventory Management Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
            <div>
              <CardTitle>Real-Time Stock Inventory</CardTitle>
              <CardDescription>Live warehouse & store stock balances</CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <select
                aria-label="Inventory view"
                value={inventoryView}
                onChange={(event) => setInventoryView(event.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="all">All inventory</option>
                <option value="low_stock">Low stock only</option>
                <option value="out_of_stock">Out of stock only</option>
              </select>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter inventory..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await refresh();
                  addToast('Stock database refreshed', 'info');
                }}
                icon={RefreshCw}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">SKU ID</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-500 dark:text-slate-400">{item.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{item.name}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{item.category}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 max-w-[120px]">
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.stock < 10 ? 'bg-rose-500' : item.stock < 30 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (item.stock / 80) * 100)}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 shrink-0">{item.stock}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">{item.unitPrice}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        item.status === 'Critical' ? 'danger' : item.status === 'Low Stock' ? 'warning' : 'success'
                      }
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPoModal(item)}
                    >
                      Create PO
                    </Button>
                  </td>
                </tr>
              ))}
              {!filteredItems.length && (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <PackageCheck className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-600 dark:text-slate-300">No inventory records available</p>
                    <p className="mt-1 text-xs text-slate-500">Ask the Business Owner to import product catalog in Business Setup.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Supplier List */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Wholesale Supplier Registry</CardTitle>
            <CardDescription>Configured vendors and lead-time SLAs</CardDescription>
          </div>
        </CardHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div key={sup.name} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{sup.name}</span>
                <Building2 className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Lead time: <strong>{sup.leadTime}</strong></p>
              <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Preferred Vendor
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Purchase Order Generator Modal */}
      <Modal
        isOpen={Boolean(selectedPoItem)}
        onClose={() => setSelectedPoItem(null)}
        title={selectedPoItem ? `Create Supplier Purchase Order • ${selectedPoItem.id}` : ''}
        maxWidth="max-w-lg"
      >
        {selectedPoItem && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Product Restock Details</div>
              <div className="text-base font-bold text-white">{selectedPoItem.name} ({selectedPoItem.id})</div>
              <div className="text-xs text-slate-400">
                Current Stock: <span className="text-rose-400 font-bold">{selectedPoItem.currentStock || selectedPoItem.stock || 0} units</span> • Minimum Safety Threshold: <span className="text-amber-400 font-bold">{selectedPoItem.minStock || 10} units</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Target Supplier</label>
              <select
                value={poSupplier}
                onChange={(e) => setPoSupplier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Primary Wholesaler Ltd">Primary Wholesaler Ltd (Lead time: 3-5 Days)</option>
                <option value="Metro Electronics Dist.">Metro Electronics Dist. (Lead time: 2 Days)</option>
                <option value="Global Retail Logistics">Global Retail Logistics (Lead time: 5-7 Days)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Reorder Quantity (Units)</label>
              <input
                type="number"
                min="1"
                value={poQuantity}
                onChange={(e) => setPoQuantity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white"
              />
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
              <span className="text-xs text-emerald-300 font-semibold">Total Estimated PO Value:</span>
              <span className="text-lg font-bold text-emerald-400">
                ₹{(Number(poQuantity || 0) * (selectedPoItem.unitPriceNum || 199)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setSelectedPoItem(null)}>
                Cancel
              </Button>
              <Button variant="secondary" size="sm" icon={Download} onClick={handleDownloadPoCsv}>
                Download PO (CSV)
              </Button>
              <Button variant="primary" size="sm" icon={Mail} onClick={handleEmailPoSupplier}>
                Email Supplier
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
