import React, { useState } from 'react';
import { MOCK_MANAGER_DATA } from '../../data/mockData';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import {
  PackageCheck,
  AlertTriangle,
  XCircle,
  Truck,
  PlusCircle,
  RefreshCw,
  Search,
  Building2,
  CheckCircle2,
  Boxes
} from 'lucide-react';

export const ManagerDashboard = () => {
  const { addToast } = useToast();
  const { inventorySummary, inventoryItems: liveInventoryItems } = useData();
  const {
    kpis: mockKpis,
    lowStockAlerts: mockLowStockAlerts,
    inventoryItems: mockInventoryItems,
    suppliers
  } = MOCK_MANAGER_DATA;
  const inventoryItems = liveInventoryItems.length
    ? liveInventoryItems.map((item) => ({
        id: item.product.sku,
        name: item.product.name,
        category: item.product.category || 'Uncategorized',
        stock: item.stock_quantity,
        unitPrice: '—',
        status: item.stock_status.replaceAll('_', ' '),
        supplier: 'Dataset import'
      }))
    : mockInventoryItems;
  const lowStockAlerts = liveInventoryItems.length
    ? liveInventoryItems
        .filter((item) => item.stock_status !== 'in_stock')
        .slice(0, 8)
        .map((item) => ({
          id: item.product.sku,
          name: item.product.name,
          currentStock: item.stock_quantity,
          minStock: item.reorder_level,
          supplier: 'Dataset import',
          leadTime: 'Not provided'
        }))
    : mockLowStockAlerts;
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

  const [searchFilter, setSearchFilter] = useState('');
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reorderQty, setReorderQty] = useState('50');

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleOpenReorder = (item) => {
    setSelectedItem(item);
    setReorderQty('50');
    setIsReorderModalOpen(true);
  };

  const handleConfirmReorder = (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    addToast(`Purchase Order generated for ${reorderQty} units of ${selectedItem.name}!`, 'success');
    setIsReorderModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Callout - Critical Stock Warning */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 border border-rose-800/80 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              Critical Stock Alert (14 SKUs)
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Store Manager Operations Dashboard</h2>
          <p className="text-sm text-rose-200">
            Thermal Receipt Paper and Bluetooth Barcode Scanner have hit critical minimum safety stock threshold.
          </p>
        </div>

        <Button
          variant="danger"
          size="md"
          icon={PlusCircle}
          onClick={() => handleOpenReorder(lowStockAlerts[0])}
          className="shrink-0 font-bold"
        >
          Quick Bulk Reorder
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
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{kpis.lowStockItems.change}</span>
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
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Pending Shipments</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.pendingOrders.value}</h3>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{kpis.pendingOrders.change}</span>
          </div>
        </Card>
      </div>

      {/* Low Stock Urgent Callout Cards */}
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
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm"
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
                onClick={() => handleOpenReorder(alert)}
                className="shrink-0"
              >
                Reorder
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Main Inventory Management Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
            <div>
              <CardTitle>Real-Time Stock Inventory</CardTitle>
              <CardDescription>Live warehouse & store stock balances</CardDescription>
            </div>

            <div className="flex items-center gap-3">
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
                onClick={() => addToast('Stock database refreshed', 'info')}
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
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenReorder(item)}
                    >
                      Reorder Stock
                    </Button>
                  </td>
                </tr>
              ))}
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
              <CardTitle>Hardware Suppliers & Logistics Performance</CardTitle>
              <CardDescription>Verified vendor SLA fulfillment rates</CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div key={sup.name} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{sup.name}</h4>
                <span className="text-xs font-bold text-amber-500">{sup.rating}</span>
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

      {/* Reorder Modal */}
      <Modal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        title={`Reorder Stock: ${selectedItem?.name || ''}`}
      >
        <form onSubmit={handleConfirmReorder} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
            <p><strong>SKU ID:</strong> {selectedItem?.id}</p>
            <p><strong>Current Warehouse Stock:</strong> {selectedItem?.stock || selectedItem?.currentStock} units</p>
            <p><strong>Preferred Supplier:</strong> {selectedItem?.supplier || 'Default Vendor'}</p>
          </div>

          <Input
            id="reorderQty"
            label="Reorder Quantity (Units)"
            type="number"
            value={reorderQty}
            onChange={(e) => setReorderQty(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsReorderModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm Purchase Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
