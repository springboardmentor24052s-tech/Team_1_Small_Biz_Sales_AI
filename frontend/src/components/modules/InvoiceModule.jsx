import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  ReceiptText,
  Plus,
  Search,
  Download,
  CreditCard,
  BellRing,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Trash2,
  Eye
} from 'lucide-react';

const emptyInvoiceForm = () => ({
  storeId: '',
  customerId: '',
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
  currency: 'INR',
  discountAmount: '0',
  notes: 'Payment due within terms. Thank you for your business.',
  terms: 'Net 15 Days',
  items: [{ productId: '', sku: '', description: '', quantity: '1', unitPrice: '', taxRate: '0.18', discountAmount: '0' }]
});

export const InvoiceModule = () => {
  const { addToast } = useToast();
  const { api, profile, currentRole, accessToken } = useAuth();
  const { customers, inventoryItems } = useData();

  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'create', 'view', 'payment'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [form, setForm] = useState(emptyInvoiceForm);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: 'upi', referenceNumber: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extraCustomers, setExtraCustomers] = useState([]);
  const [extraProducts, setExtraProducts] = useState([]);

  const permissions = useMemo(
    () => new Set(profile?.role?.permissions || []),
    [profile?.role?.permissions]
  );
  const canManage = permissions.has('invoices.manage') || currentRole?.id === 'admin' || currentRole?.id === 'sales';

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await api('/invoices?limit=100');
      setInvoices(res.items || []);
    } catch (err) {
      addToast({ title: 'Error loading invoices', message: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    if (!customers || customers.length === 0) {
      api('/customers?limit=100').then((res) => setExtraCustomers(res.items || [])).catch(() => {});
    }
    if (!inventoryItems || inventoryItems.length === 0) {
      api('/inventory?limit=100').then((res) => setExtraProducts(res.items || [])).catch(() => {});
    }
  }, []);

  const activeCustomers = customers && customers.length > 0 ? customers : extraCustomers;
  const activeProducts = inventoryItems && inventoryItems.length > 0 ? inventoryItems : extraProducts;

  const filteredInvoices = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      if (!term) return matchesStatus;
      
      const invNum = (inv.invoice_number || '').toLowerCase();
      const custName = (inv.customer_name || '').toLowerCase();
      const sellerName = (inv.seller_name || '').toLowerCase();
      const notes = (inv.notes || '').toLowerCase();
      const status = (inv.status || '').toLowerCase();
      const total = String(inv.total_amount || '');
      const itemsMatch = (inv.items || []).some((it) => 
        (it.description || '').toLowerCase().includes(term) || (it.sku || '').toLowerCase().includes(term)
      );
      const paymentsMatch = (inv.payments || []).some((p) =>
        (p.reference_number || '').toLowerCase().includes(term) || (p.payment_method || '').toLowerCase().includes(term)
      );

      const matchesSearch =
        invNum.includes(term) ||
        custName.includes(term) ||
        sellerName.includes(term) ||
        notes.includes(term) ||
        status.includes(term) ||
        total.includes(term) ||
        itemsMatch ||
        paymentsMatch;

      return matchesStatus && matchesSearch;
    });
  }, [invoices, statusFilter, searchTerm]);

  // Form Calculations
  const calculatedTotals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    let totalDisc = Number(form.discountAmount || 0);

    form.items.forEach((item) => {
      const qty = Number(item.quantity || 1);
      const price = Number(item.unitPrice || 0);
      const disc = Number(item.discountAmount || 0);
      const taxRate = Number(item.taxRate || 0.18);

      const net = Math.max(0, qty * price - disc);
      subtotal += qty * price;
      totalTax += net * taxRate;
      totalDisc += disc;
    });

    const total = Math.max(0, subtotal - totalDisc + totalTax);
    return { subtotal, totalTax, totalDisc, total };
  }, [form]);

  const handleAddItem = () => {
    setForm((curr) => ({
      ...curr,
      items: [...curr.items, { productId: '', sku: '', description: '', quantity: '1', unitPrice: '', taxRate: '0.18', discountAmount: '0' }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (form.items.length <= 1) return;
    setForm((curr) => ({
      ...curr,
      items: curr.items.filter((_, i) => i !== index)
    }));
  };

  const handleProductSelect = (index, productId) => {
    const prod = (activeProducts || []).find((item) => item.product_id === productId || item.id === productId || item.product?.id === productId)?.product ||
                 (activeProducts || []).find((item) => item.id === productId || item.product_id === productId);
    setForm((curr) => {
      const updated = [...curr.items];
      updated[index] = {
        ...updated[index],
        productId: productId || null,
        sku: prod?.sku || prod?.product?.sku || updated[index].sku || 'CUSTOM',
        description: prod?.name || prod?.product?.name || updated[index].description || 'Item Description',
        unitPrice: String(prod?.unit_price || prod?.product?.unit_price || updated[index].unitPrice || '1000')
      };
      return { ...curr, items: updated };
    });
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        store_id: form.storeId || profile?.store_id || null,
        customer_id: form.customerId ? form.customerId : null,
        invoice_date: form.invoiceDate,
        due_date: form.dueDate,
        currency: form.currency || 'INR',
        discount_amount: form.discountAmount || '0',
        notes: form.notes || null,
        terms: form.terms || null,
        items: form.items.map((it) => ({
          product_id: it.productId ? it.productId : null,
          sku: it.sku || 'SKU-CUSTOM',
          description: it.description || 'Line item',
          quantity: Number(it.quantity || 1),
          unit_price: String(it.unitPrice || '0'),
          discount_amount: String(it.discountAmount || '0'),
          tax_rate: String(it.taxRate || '0.18')
        }))
      };

      await api('/invoices', { method: 'POST', body: JSON.stringify(payload) });
      addToast({ title: 'Invoice Created', message: 'Invoice generated successfully', type: 'success' });
      setModalMode(null);
      setForm(emptyInvoiceForm());
      fetchInvoices();
    } catch (err) {
      addToast({ title: 'Creation failed', message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setIsSubmitting(true);
    try {
      await api(`/invoices/${selectedInvoice.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: paymentForm.amount,
          payment_method: paymentForm.paymentMethod,
          reference_number: paymentForm.referenceNumber,
          notes: paymentForm.notes
        })
      });
      addToast({ title: 'Payment Recorded', message: 'Payment applied successfully', type: 'success' });
      setModalMode(null);
      setPaymentForm({ amount: '', paymentMethod: 'upi', referenceNumber: '', notes: '' });
      fetchInvoices();
    } catch (err) {
      addToast({ title: 'Payment failed', message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReminder = async (invoice) => {
    try {
      await api(`/invoices/${invoice.id}/remind`, { method: 'POST' });
      addToast({ title: 'Reminder Sent', message: `Due date reminder sent for ${invoice.invoice_number}`, type: 'success' });
      fetchInvoices();
    } catch (err) {
      addToast({ title: 'Reminder failed', message: err.message, type: 'error' });
    }
  };

  const handleDownloadPdf = async (invoiceId) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api/v1';
      const token = accessToken;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await fetch(`${baseUrl}/reports/export/invoices/${invoiceId}${token ? `?token=${encodeURIComponent(token)}` : ''}`, {
        headers
      });

      if (!res.ok) {
        throw new Error(`Failed to load invoice report (${res.status})`);
      }

      const htmlContent = await res.text();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        window.open(`${baseUrl}/reports/export/invoices/${invoiceId}?token=${encodeURIComponent(token || '')}`, '_blank');
      }
    } catch (err) {
      addToast({ title: 'Print / Export Failed', message: err.message, type: 'error' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'partially_paid':
        return <Badge variant="warning">Partially Paid</Badge>;
      case 'pending':
        return <Badge variant="neutral">Pending</Badge>;
      case 'overdue':
        return <Badge variant="danger">Overdue</Badge>;
      case 'voided':
        return <Badge variant="danger">Voided</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <ReceiptText className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Invoice & Billing Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate GST tax invoices, track payment receipts, and automate overdue reminders.
          </p>
        </div>

        {canManage && (
          <Button
            onClick={() => {
              setForm(emptyInvoiceForm());
              setModalMode('create');
            }}
            variant="primary"
            icon={Plus}
          >
            Create New Invoice
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border-indigo-100 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Total Invoices</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{invoices.length}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50/50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border-emerald-100 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Paid Invoices</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {invoices.filter((i) => i.status === 'paid').length}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50/50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border-amber-100 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Pending Collection</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {invoices.filter((i) => i.status === 'pending' || i.status === 'partially_paid').length}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-rose-50/50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border-rose-100 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Overdue</p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {invoices.filter((i) => i.status === 'overdue').length}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader
          title="Invoices Register"
          action={
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {['all', 'pending', 'paid', 'overdue'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      statusFilter === st
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-y border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Date / Due</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Balance</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No invoices match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div>{inv.invoice_date}</div>
                      <div className="text-slate-400 font-mono text-[11px]">Due: {inv.due_date}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {inv.customer_name || 'Retail Customer'}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      ₹{Number(inv.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-rose-600 dark:text-rose-400">
                      ₹{Number(inv.balance_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setModalMode('view');
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(inv.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700"
                          title="Print / PDF Invoice"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {canManage && inv.status !== 'paid' && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentForm({
                                amount: String(inv.balance_amount),
                                paymentMethod: 'upi',
                                referenceNumber: '',
                                notes: ''
                              });
                              setModalMode('payment');
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700"
                            title="Record Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        {canManage && inv.status !== 'paid' && (
                          <button
                            onClick={() => handleSendReminder(inv)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700"
                            title="Send Payment Reminder"
                          >
                            <BellRing className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Create Invoice */}
      <Modal
        isOpen={modalMode === 'create'}
        onClose={() => setModalMode(null)}
        title="Generate Tax Invoice"
        size="lg"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Customer (Optional)</label>
              <select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white"
              >
                <option value="">Walk-in Retail Customer</option>
                {activeCustomers.map((c) => (
                  <option key={c.id} value={c.id}>{c.external_customer_id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Invoice Date</label>
              <Input
                type="date"
                value={form.invoiceDate}
                onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Due Date</label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Line Items List */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Invoice Items</h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            {form.items.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                <div className="sm:col-span-4">
                  <label className="text-[11px] text-slate-400 block mb-0.5">Product SKU / Catalog</label>
                  <select
                    value={item.productId}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="">Select Catalog Product...</option>
                    {activeProducts.map((inv) => (
                      <option key={inv.id} value={inv.product?.id || inv.product_id || inv.id}>
                        {inv.product?.name || inv.name || 'Product'} ({inv.product?.sku || inv.sku || 'CUSTOM'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] text-slate-400 block mb-0.5">Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => {
                      const updated = [...form.items];
                      updated[idx].description = e.target.value;
                      setForm({ ...form, items: updated });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-400 block mb-0.5">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => {
                      const updated = [...form.items];
                      updated[idx].unitPrice = e.target.value;
                      setForm({ ...form, items: updated });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-400 block mb-0.5">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const updated = [...form.items];
                      updated[idx].quantity = e.target.value;
                      setForm({ ...form, items: updated });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                    required
                  />
                </div>

                <div className="sm:col-span-1 flex justify-center pb-1">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg"
                    disabled={form.items.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Summary */}
          <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-slate-800/40 border border-indigo-100 dark:border-slate-700/60 flex flex-col items-end gap-1 text-xs">
            <div className="flex justify-between w-48 text-slate-500">
              <span>Subtotal:</span>
              <span>₹{calculatedTotals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-48 text-slate-500">
              <span>Taxes (18% GST):</span>
              <span>+ ₹{calculatedTotals.totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-48 font-bold text-sm text-indigo-600 dark:text-indigo-400 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Total Amount:</span>
              <span>₹{calculatedTotals.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" onClick={() => setModalMode(null)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Generating...' : 'Confirm & Issue Invoice'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Payment */}
      <Modal
        isOpen={modalMode === 'payment'}
        onClose={() => setModalMode(null)}
        title={`Record Payment for ${selectedInvoice?.invoice_number}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Payment Amount (₹) - Max ₹{selectedInvoice?.balance_amount}
            </label>
            <Input
              type="number"
              min="0.01"
              max={selectedInvoice?.balance_amount}
              step="0.01"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Payment Method</label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white"
            >
              <option value="upi">UPI / QR Code</option>
              <option value="cash">Cash Receipt</option>
              <option value="card">Credit / Debit Card</option>
              <option value="bank_transfer">Net Banking / NEFT</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Reference # (Optional)</label>
            <Input
              type="text"
              placeholder="e.g. UPI-TXN-998822"
              value={paymentForm.referenceNumber}
              onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" onClick={() => setModalMode(null)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Apply Payment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Invoice Details */}
      <Modal
        isOpen={modalMode === 'view'}
        onClose={() => setModalMode(null)}
        title={`Tax Invoice: ${selectedInvoice?.invoice_number}`}
        size="lg"
      >
        {selectedInvoice && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-start pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedInvoice.invoice_number}</p>
                <p className="text-slate-500">Date: {selectedInvoice.invoice_date} | Due: {selectedInvoice.due_date}</p>
                <p className="text-slate-500">Customer: <strong className="text-slate-700 dark:text-slate-200">{selectedInvoice.customer_name}</strong></p>
              </div>
              <div className="text-right">
                {getStatusBadge(selectedInvoice.status)}
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1.5">
                  Total: ₹{Number(selectedInvoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div>
              <h5 className="font-bold uppercase text-[11px] text-slate-400 mb-2">Itemized Breakdown</h5>
              <div className="space-y-1.5">
                {(selectedInvoice.items || []).map((it, i) => (
                  <div key={i} className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <div>
                      <span className="font-semibold">{it.sku}</span> - {it.description} (x{it.quantity})
                    </div>
                    <div className="font-bold">
                      ₹{Number(it.line_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedInvoice.payments?.length > 0 && (
              <div>
                <h5 className="font-bold uppercase text-[11px] text-slate-400 mb-2">Payment History</h5>
                <div className="space-y-1.5">
                  {selectedInvoice.payments.map((p, i) => (
                    <div key={i} className="flex justify-between p-2 rounded-lg bg-emerald-50/50 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300">
                      <div>
                        Payment via <span className="font-bold uppercase">{p.payment_method}</span> ({p.recorded_at.slice(0, 10)})
                      </div>
                      <div className="font-bold">
                        ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <Button variant="secondary" onClick={() => handleDownloadPdf(selectedInvoice.id)} icon={Download}>
                Print Tax Invoice
              </Button>
              <Button variant="primary" onClick={() => setModalMode(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

