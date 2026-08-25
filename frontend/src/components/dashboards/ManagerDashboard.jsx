import React, { useEffect, useState, useMemo } from 'react';
import { MOCK_MANAGER_DATA } from '../../data/mockData';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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
  Edit3,
  PackagePlus,
  Sliders,
  FileText
} from 'lucide-react';

export const ManagerDashboard = () => {
  const { profile, api } = useAuth();
  const { addToast } = useToast();
  const { inventorySummary, inventoryItems: liveInventoryItems, refresh } = useData();
  const {
    kpis: mockKpis,
    suppliers
  } = MOCK_MANAGER_DATA;

  const [searchFilter, setSearchFilter] = useState('');
  const preferredInventoryView = profile?.role_preferences?.inventory_view || 'all';
  const [inventoryView, setInventoryView] = useState(preferredInventoryView);
  const stockAlertsEnabled = profile?.role_preferences?.stock_alerts ?? true;
  useEffect(() => setInventoryView(preferredInventoryView), [preferredInventoryView]);

  // Modals state
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [adjustForm, setAdjustForm] = useState({
    mode: 'add', // 'add' | 'set'
    quantity: '25',
    reorderLevel: '10'
  });

  const [poForm, setPoForm] = useState({
    supplier: 'Apex Electronics Logistics',
    quantity: '50',
    leadTime: '3 Days',
    notes: 'Urgent restock for storefront shelf demand'
  });

  // Map inventory items with real database UUIDs
  const inventoryItems = useMemo(() => {
    return (liveInventoryItems || []).map((item) => ({
      inventoryId: item.id,
      productId: item.product?.id || item.product_id,
      sku: item.product?.sku || 'SKU',
      name: item.product?.name || 'Product',
      category: item.product?.category || 'General',
      stock: item.stock_quantity ?? 0,
      reorderLevel: item.reorder_level ?? 10,
      unitPrice: item.product?.unit_price ? `₹${Number(item.product.unit_price).toLocaleString('en-IN')}` : '₹999.00',
      status: (item.stock_status || 'in_stock').replaceAll('_', ' '),
      rawStatus: item.stock_status || 'in_stock',
      supplier: 'Apex Electronics Logistics'
    }));
  }, [liveInventoryItems]);

  const lowStockAlerts = useMemo(() => {
    return inventoryItems
      .filter((item) => item.rawStatus !== 'in_stock' || item.stock <= item.reorderLevel)
      .slice(0, 8)
      .map((item) => ({
        ...item,
        currentStock: item.stock,
        minStock: item.reorderLevel,
        leadTime: '2-3 Days'
      }));
  }, [inventoryItems]);

  const kpis = {
    ...mockKpis,
    totalSKUs: {
      ...mockKpis.totalSKUs,
      value: inventorySummary ? `${inventorySummary.product_count} SKUs` : `${inventoryItems.length} SKUs`,
      change: inventorySummary ? `${inventorySummary.total_units} units` : mockKpis.totalSKUs.change
    },
    lowStockItems: {
      ...mockKpis.lowStockItems,
      value: inventorySummary ? `${inventorySummary.low_stock_count} Items` : `${lowStockAlerts.length} Items`
    },
    outOfStock: {
      ...mockKpis.outOfStock,
      value: inventorySummary ? `${inventorySummary.out_of_stock_count} Items` : '0 Items'
    }
  };

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.category.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesView = inventoryView === 'all' || item.rawStatus === inventoryView;
      return matchesSearch && matchesView;
    });
  }, [inventoryItems, searchFilter, inventoryView]);

  const alertCount = inventorySummary
    ? inventorySummary.low_stock_count + inventorySummary.out_of_stock_count
    : lowStockAlerts.length;
  const alertNames = lowStockAlerts.slice(0, 2).map((item) => item.name).join(' and ');

  // Open stock adjustment modal
  const openAdjustModal = (item) => {
    setSelectedItem(item);
    setAdjustForm({
      mode: 'add',
      quantity: '20',
      reorderLevel: String(item.reorderLevel || 10)
    });
    setIsAdjustModalOpen(true);
  };

  // Open PO modal
  const openPoModal = (item = null) => {
    setSelectedItem(item || inventoryItems[0] || null);
    setPoForm({
      supplier: item?.supplier || 'Apex Electronics Logistics',
      quantity: '50',
      leadTime: '3 Days',
      notes: `Restock request for ${item?.name || 'store inventory'}`
    });
    setIsPoModalOpen(true);
  };

  // Handle stock adjustment submission
  const handleSaveStockAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      const currentStock = selectedItem.stock || 0;
      const qtyChange = parseInt(adjustForm.quantity || '0', 10);
      const newStock = adjustForm.mode === 'add'
        ? Math.max(0, currentStock + qtyChange)
        : Math.max(0, qtyChange);
      const newReorder = parseInt(adjustForm.reorderLevel || '10', 10);

      // Call API PATCH /api/v1/inventory/{id}
      await api(`/inventory/${selectedItem.inventoryId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          stock_quantity: newStock,
          reorder_level: newReorder
        })
      });

      addToast({
        title: 'Inventory Updated',
        message: `Updated ${selectedItem.name}: Now ${newStock} units (Safety min: ${newReorder})`,
        type: 'success'
      });

      setIsAdjustModalOpen(false);
      await refresh();
    } catch (err) {
      addToast({
        title: 'Update Failed',
        message: err.message || 'Failed to update stock',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle PO generation
  const handleCreatePurchaseOrder = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsPoModalOpen(false);
      addToast({
        title: 'Purchase Order Created',
        message: `PO #${Math.floor(1000 + Math.random() * 9000)} dispatched to ${poForm.supplier} for ${poForm.quantity} units of ${selectedItem?.name || 'catalog items'}.`,
        type: 'success'
      });
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Callout - Critical Stock Warning */}
      <div className={`p-6 rounded-2xl ${stockAlertsEnabled ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 border-rose-800/80' : 'bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-emerald-800/60'} border text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              {stockAlertsEnabled ? `Stock Alert (${alertCount} SKUs)` : 'Stock alerts paused'}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Store Manager Operations Dashboard</h2>
          <p className="text-sm text-rose-200">
            {stockAlertsEnabled ? `${alertNames || 'All products in stock'} ${lowStockAlerts.length > 0 ? 'are currently below safety thresholds.' : ''}` : 'Stock risk notifications and the priority queue are hidden by your saved preference.'}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={PlusCircle}
          onClick={() => openPoModal(lowStockAlerts[0] || inventoryItems[0])}
          className="shrink-0 font-bold shadow-lg shadow-indigo-600/30"
        >
          Raise Purchase Order
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
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Needs attention</span>
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
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">{kpis.outOfStock.change}</span>
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Active Suppliers</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{suppliers.length} Connected</h3>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">98% fulfillment rate</span>
          </div>
        </Card>
      </div>

      {/* Low Stock Urgent Callout Cards */}
      {stockAlertsEnabled && lowStockAlerts.length > 0 && (
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
                key={alert.sku}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{alert.name}</span>
                    <Badge variant="danger" size="sm">{alert.sku}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Current: <strong className="text-rose-600 dark:text-rose-400">{alert.currentStock} units</strong> (Min Safety: {alert.minStock})
                  </p>
                  <p className="text-[11px] text-slate-400">Supplier: {alert.supplier} • Lead time: {alert.leadTime}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Sliders}
                    onClick={() => openAdjustModal(alert)}
                  >
                    Adjust
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={PackagePlus}
                    onClick={() => openPoModal(alert)}
                  >
                    Restock
                  </Button>
                </div>
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
              <CardDescription>Live warehouse & store stock balances with instant adjustments</CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <select
                aria-label="Inventory view"
                value={inventoryView}
                onChange={(event) => setInventoryView(event.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-900 dark:text-white dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="all">All inventory</option>
                <option value="low_stock">Low stock only</option>
                <option value="out_of_stock">Out of stock only</option>
              </select>

              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by name, SKU or category..."
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
                  addToast({ title: 'Refreshed', message: 'Stock database synchronized successfully', type: 'info' });
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
                <tr key={item.sku} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-500 dark:text-slate-400">{item.sku}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{item.name}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{item.category}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 max-w-[140px]">
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.stock <= item.reorderLevel ? 'bg-amber-500' : item.stock === 0 ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (item.stock / 60) * 100)}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 shrink-0">{item.stock}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">{item.unitPrice}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        item.stock === 0 ? 'danger' : item.stock <= item.reorderLevel ? 'warning' : 'success'
                      }
                    >
                      {item.stock === 0 ? 'Out of Stock' : item.stock <= item.reorderLevel ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Sliders}
                        onClick={() => openAdjustModal(item)}
                        title="Adjust Stock Quantity or Threshold"
                      >
                        Adjust
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={PackagePlus}
                        onClick={() => openPoModal(item)}
                        title="Raise Purchase Order"
                      >
                        Restock
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredItems.length && (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <PackageCheck className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-600 dark:text-slate-300">No inventory records matching filter</p>
                    <p className="mt-1 text-xs text-slate-500">Try adjusting your search criteria or refreshing stock data.</p>
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
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            <div>
              <CardTitle>Connected Suppliers & Logistics</CardTitle>
              <CardDescription>Active verified supplier networks and performance ratings</CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div key={sup.name} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{sup.name}</h4>
                <span className="text-xs font-bold text-amber-500">{sup.rating} ★</span>
              </div>
              <p className="text-xs text-slate-500">{sup.itemsSupplied} Products Cataloged</p>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{sup.deliveryStatus}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal: Adjust Stock Level */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Stock: ${selectedItem?.name || ''} (${selectedItem?.sku || ''})`}
      >
        <form onSubmit={handleSaveStockAdjustment} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-500 block">Current Stock:</span>
              <strong className="text-base text-indigo-600 dark:text-indigo-400">{selectedItem?.stock || 0} units</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Safety Min Threshold:</span>
              <strong className="text-base">{selectedItem?.reorderLevel || 10} units</strong>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Adjustment Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustForm({ ...adjustForm, mode: 'add' })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                  adjustForm.mode === 'add'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                + Receive / Add Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustForm({ ...adjustForm, mode: 'set', quantity: String(selectedItem?.stock || 0) })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                  adjustForm.mode === 'set'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Set Exact Recount
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {adjustForm.mode === 'add' ? 'Units to Add (+)' : 'New Total Count'}
            </label>
            <Input
              type="number"
              min={adjustForm.mode === 'add' ? '1' : '0'}
              value={adjustForm.quantity}
              onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Safety Reorder Level (Low Stock Trigger)
            </label>
            <Input
              type="number"
              min="0"
              value={adjustForm.reorderLevel}
              onChange={(e) => setAdjustForm({ ...adjustForm, reorderLevel: e.target.value })}
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-300">Resulting Stock Balance:</span>
            <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
              {adjustForm.mode === 'add'
                ? (selectedItem?.stock || 0) + (parseInt(adjustForm.quantity || '0', 10))
                : parseInt(adjustForm.quantity || '0', 10)}{' '}
              units
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsAdjustModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Apply Stock Change'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Raise Purchase Order */}
      <Modal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        title={`Raise Purchase Order: ${selectedItem?.name || 'Inventory'}`}
      >
        <form onSubmit={handleCreatePurchaseOrder} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Supplier</label>
            <select
              value={poForm.supplier}
              onChange={(e) => setPoForm({ ...poForm, supplier: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white"
            >
              {suppliers.map((s) => (
                <option key={s.name} value={s.name}>{s.name} ({s.rating} ★)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Reorder Quantity (Units)</label>
              <Input
                type="number"
                min="1"
                value={poForm.quantity}
                onChange={(e) => setPoForm({ ...poForm, quantity: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Lead Time</label>
              <Input
                type="text"
                value={poForm.leadTime}
                onChange={(e) => setPoForm({ ...poForm, leadTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">PO Notes / Special Instructions</label>
            <textarea
              value={poForm.notes}
              onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
              className="w-full h-20 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsPoModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Dispatched...' : 'Confirm & Dispatch PO'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
