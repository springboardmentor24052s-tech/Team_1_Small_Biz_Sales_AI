import React, { useMemo, useState } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { B2bInvoiceModal } from '../common/B2bInvoiceModal';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBag,
  Search,
  Plus,
  FileText,
  Download,
  Pencil,
  Ban,
  PackagePlus,
  Trash2,
  Printer,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Wallet,
  Building2,
  CreditCard,
  Calendar
} from 'lucide-react';

const emptyForm = () => ({
  externalReference: '',
  occurredAt: new Date().toISOString().slice(0, 16),
  currency: 'INR',
  totalAmount: '',
  itemCount: '1',
  selectedCustomerId: '',
  customerReference: '',
  paymentMethod: 'upi',
  paymentStatus: 'paid',
  creditTerms: 'Net 30',
  orderDiscount: '0',
  taxAmount: '0',
  autoCalculateTax: true,
  items: [{ productId: '', quantity: '1', unitPrice: '', discountAmount: '0' }],
  notes: ''
});

export const SalesModule = () => {
  const { addToast } = useToast();
  const { salesTransactions, customers = [], refresh } = useData();
  const { api, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [modalMode, setModalMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceTransaction, setInvoiceTransaction] = useState(null);

  const openInvoiceModal = (deal) => {
    setInvoiceTransaction(deal);
    setIsInvoiceOpen(true);
  };

  const permissions = useMemo(
    () => new Set(profile?.role?.permissions || []),
    [profile?.role?.permissions]
  );
  const canCreate = permissions.has('sales.create') && Boolean(profile?.store_id);
  const canUpdate = permissions.has('sales.update.store') || permissions.has('sales.update.own');
  const canVoid = permissions.has('sales.void');

  const deals = useMemo(() => {
    return (salesTransactions || []).map((transaction) => ({
      ...transaction,
      displayReference: transaction.external_reference || (transaction.id ? `INV-${transaction.id.slice(0, 8).toUpperCase()}` : 'INV-0001'),
      formattedAmount: new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: transaction.currency || 'INR'
      }).format(Number(transaction.total_amount || 0))
    }));
  }, [salesTransactions]);

  // Top Summary Business KPIs
  const ledgerKpis = useMemo(() => {
    const totalVolume = deals.reduce((sum, d) => sum + Number(d.total_amount || 0), 0);
    const clearedCash = deals
      .filter((d) => d.payment_status === 'paid')
      .reduce((sum, d) => sum + Number(d.total_amount || 0), 0);
    const outstandingCredit = deals
      .filter((d) => d.payment_status === 'unpaid' || d.payment_status === 'overdue')
      .reduce((sum, d) => sum + Number(d.total_amount || 0), 0);
    const overdueCount = deals.filter((d) => d.payment_status === 'overdue').length;

    return { totalVolume, clearedCash, outstandingCredit, overdueCount };
  }, [deals]);

  const filteredDeals = deals.filter((deal) => {
    const customerObj = (customers || []).find((c) => c.id === deal.customer_id);
    const custName = customerObj ? (customerObj.company_name || customerObj.name) : (deal.customer_reference || '');
    const matchesSearch = `${deal.displayReference} ${custName} ${deal.source_system || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesPayment = paymentFilter === 'all' || deal.payment_status === paymentFilter;
    const matchesMethod = methodFilter === 'all' || deal.payment_method === methodFilter;
    return matchesSearch && matchesPayment && matchesMethod;
  });

  const orderSummary = useMemo(() => {
    const subtotal = form.items.reduce(
      (sum, item) => sum + Math.max(0, Number(item.unitPrice || 0) * Number(item.quantity || 0) - Number(item.discountAmount || 0)),
      0
    );
    const calculatedTax = form.autoCalculateTax ? (subtotal - Number(form.orderDiscount || 0)) * 0.18 : Number(form.taxAmount || 0);
    const total = subtotal - Number(form.orderDiscount || 0) + calculatedTax;
    return {
      subtotal,
      tax: calculatedTax,
      total,
      quantity: form.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    };
  }, [form.items, form.orderDiscount, form.taxAmount, form.autoCalculateTax]);

  const openCreate = async () => {
    if (!canCreate) {
      addToast('Your role or store assignment does not allow transaction creation.', 'danger');
      return;
    }
    try {
      setCatalog(await api('/sales/catalog'));
      setSelected(null);
      setForm(emptyForm());
      setModalMode('create');
    } catch (error) {
      addToast(error.message, 'danger');
    }
  };

  const openEdit = (transaction) => {
    setSelected(transaction);
    setForm({
      externalReference: transaction.external_reference || '',
      occurredAt: new Date(transaction.occurred_at || Date.now()).toISOString().slice(0, 16),
      currency: transaction.currency || 'INR',
      totalAmount: String(transaction.total_amount || ''),
      itemCount: String(transaction.item_count || '1'),
      selectedCustomerId: transaction.customer_id || '',
      customerReference: transaction.customer_reference || '',
      paymentMethod: transaction.payment_method || 'upi',
      paymentStatus: transaction.payment_status || 'paid',
      creditTerms: transaction.credit_terms || 'Net 30',
      notes: transaction.notes || '',
      items: [{ productId: '', quantity: '1', unitPrice: '', discountAmount: '0' }],
      autoCalculateTax: false,
      orderDiscount: '0',
      taxAmount: String(transaction.tax_amount || '0')
    });
    setModalMode('edit');
  };

  const markAsPaid = async (deal) => {
    setIsSaving(true);
    try {
      await api(`/sales/transactions/${deal.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ payment_status: 'paid' })
      });
      addToast(`Payment recorded for Invoice ${deal.displayReference}. Status updated to Paid.`, 'success');
      await refresh();
    } catch (error) {
      addToast(error.message || 'Failed to update payment status', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const submitTransaction = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const selectedCust = customers.find((c) => c.id === form.selectedCustomerId);
      const custRef = selectedCust ? (selectedCust.company_name || selectedCust.name) : form.customerReference.trim();

      const payload = {
        external_reference: form.externalReference.trim() || null,
        occurred_at: new Date(form.occurredAt).toISOString(),
        total_amount: Number(orderSummary.total || form.totalAmount),
        item_count: Number(orderSummary.quantity || form.itemCount),
        notes: form.notes.trim() || null
      };

      if (modalMode === 'create') {
        await api('/sales/transactions', {
          method: 'POST',
          body: JSON.stringify({
            external_reference: payload.external_reference,
            occurred_at: payload.occurred_at,
            store_id: profile.store_id,
            currency: form.currency.toUpperCase(),
            payment_method: form.paymentMethod,
            customer_reference: custRef || null,
            order_discount: Number(form.orderDiscount || 0),
            tax_amount: Number(orderSummary.tax),
            notes: payload.notes,
            items: form.items.map((item) => ({
              product_id: item.productId,
              quantity: Number(item.quantity),
              unit_price: Number(item.unitPrice),
              discount_amount: Number(item.discountAmount || 0)
            }))
          })
        });
        addToast('Sales transaction recorded. Inventory and customer ledgers updated.', 'success');
      } else {
        await api(`/sales/transactions/${selected.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...payload,
            payment_status: form.paymentStatus
          })
        });
        addToast('Sales transaction updated successfully.', 'success');
      }
      setModalMode(null);
      await refresh();
    } catch (error) {
      addToast(error.message, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const updateLine = (index, field, value) =>
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    }));

  const addLine = () =>
    setForm((current) => ({
      ...current,
      items: [...current.items, { productId: '', quantity: '1', unitPrice: '', discountAmount: '0' }]
    }));

  const removeLine = (index) =>
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index)
    }));

  const voidTransaction = async () => {
    setIsSaving(true);
    try {
      const response = await api(`/sales/transactions/${selected.id}/void`, {
        method: 'POST'
      });
      addToast(response.message, 'success');
      setModalMode(null);
      await refresh();
    } catch (error) {
      addToast(error.message, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const exportLedger = () => {
    const header = ['invoice_ref', 'client_company', 'occurred_at', 'amount', 'currency', 'items', 'payment_method', 'payment_status', 'credit_terms'];
    const rows = filteredDeals.map((deal) => {
      const cust = customers.find((c) => c.id === deal.customer_id);
      const custName = cust ? (cust.company_name || cust.name) : (deal.customer_reference || 'Walk-in');
      return [
        deal.displayReference,
        custName,
        deal.occurred_at,
        deal.total_amount,
        deal.currency,
        deal.item_count,
        deal.payment_method || 'N/A',
        deal.payment_status || 'paid',
        deal.credit_terms || 'Net 30'
      ];
    });
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `marketmind-b2b-sales-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const getChannelBadge = (source) => {
    if (!source) return { label: 'Wholesale Order', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
    if (source.includes('pos')) return { label: 'Field Sales POS', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    if (source.includes('manual')) return { label: 'Counter Order', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    return { label: 'B2B Invoice', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  };

  const getCustomerObj = (deal) => {
    if (deal.customer_id) {
      const found = customers.find((c) => c.id === deal.customer_id);
      if (found) return found;
    }
    return null;
  };

  const selectedCustDetails = useMemo(() => {
    if (!form.selectedCustomerId) return null;
    return customers.find((c) => c.id === form.selectedCustomerId);
  }, [form.selectedCustomerId, customers]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Title & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-500" />
            <span>Sales & B2B Invoicing Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Commercial wholesale ledger, credit terms, collections, and statutory GST Tax Invoice generation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={exportLedger}>
            Export Sales Register
          </Button>
          {canCreate && (
            <Button variant="primary" size="sm" icon={Plus} onClick={openCreate}>
              New B2B Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Commercial Summary Business KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-indigo-900/20 to-slate-900/40 border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Sales Volume</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-bold text-indigo-400 mt-2">
            ₹{ledgerKpis.totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Sum of all generated sales invoices</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-900/20 to-slate-900/40 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Cleared Collections</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400 mt-2">
            ₹{ledgerKpis.clearedCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-emerald-400/80 mt-1">Fully settled payments (Cash/UPI/Bank)</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-900/20 to-slate-900/40 border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Outstanding Credit</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-400 mt-2">
            ₹{ledgerKpis.outstandingCredit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-amber-400/80 mt-1">Pending collection on credit terms</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-rose-900/20 to-slate-900/40 border-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Overdue Risk Invoices</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-bold text-rose-400 mt-2">{ledgerKpis.overdueCount} Invoices</p>
          <p className="text-[10px] text-rose-400/80 mt-1">Past credit terms requiring immediate recovery</p>
        </Card>
      </div>

      {/* Main Ledger Table Card */}
      <Card>
        <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice, client, or ref..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            {/* Payment Method Selector */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="py-2 px-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Payment Methods</option>
              <option value="upi">UPI / QR Code</option>
              <option value="cash">Cash Counter</option>
              <option value="bank_transfer">Bank Transfer (NEFT)</option>
              <option value="other">Credit Ledger / Other</option>
            </select>
          </div>

          {/* Payment Status Ledger Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs w-full lg:w-auto overflow-x-auto">
            {['all', 'paid', 'unpaid', 'overdue'].map((tab) => (
              <button
                key={tab}
                onClick={() => setPaymentFilter(tab)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize whitespace-nowrap transition-all ${
                  paymentFilter === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab === 'all' ? 'All Invoices' : tab}
              </button>
            ))}
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice & Order Type</th>
                <th className="py-3 px-4">Client Company / Retailer</th>
                <th className="py-3 px-4">Status & Terms</th>
                <th className="py-3 px-4">Invoice Amount</th>
                <th className="py-3 px-4">Items / Volume</th>
                <th className="py-3 px-4 text-right">Commercial Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredDeals.map((deal) => {
                const cust = getCustomerObj(deal);
                const channel = getChannelBadge(deal.source_system);
                const isPendingPayment = deal.payment_status === 'unpaid' || deal.payment_status === 'overdue';

                return (
                  <tr key={deal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {/* Invoice Ref & Channel */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{deal.displayReference}</p>
                      <span className={`inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded border ${channel.color}`}>
                        {channel.label}
                      </span>
                    </td>

                    {/* Client Company / Retailer */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {cust ? (cust.company_name || cust.name) : (deal.customer_reference || 'Walk-in Buyer')}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {cust?.gstin ? `GSTIN: ${cust.gstin}` : (cust?.territory_route ? `Route: ${cust.territory_route}` : 'Counter Sale')}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status & Terms */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                            deal.payment_status === 'overdue'
                              ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                              : deal.payment_status === 'unpaid'
                              ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                          }`}
                        >
                          {deal.payment_status === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                          {deal.payment_status === 'unpaid' && <Clock className="w-3 h-3" />}
                          {deal.payment_status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                          <span>{deal.payment_status || 'Paid'}</span>
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Terms: {deal.credit_terms || 'Net 30'} · {deal.payment_method?.toUpperCase() || 'UPI'}
                        </p>
                      </div>
                    </td>

                    {/* Invoice Amount */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{deal.formattedAmount}</p>
                      <p className="text-[10px] text-slate-400">Incl. CGST/SGST 18%</p>
                    </td>

                    {/* Items / Volume */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{deal.item_count} Units</p>
                      <p className="text-[10px] text-slate-400">{new Date(deal.occurred_at).toLocaleDateString()}</p>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex justify-end items-center gap-1.5">
                        {isPendingPayment && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={CheckCircle2}
                            onClick={() => markAsPaid(deal)}
                            className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                            title="Record Cash Collection / Clear Credit"
                          >
                            Mark Paid
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Printer}
                          onClick={() => openInvoiceModal(deal)}
                          className="text-[11px] hover:border-indigo-500 hover:text-indigo-500"
                        >
                          GST Invoice
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={FileText}
                          onClick={() => {
                            setSelected(deal);
                            setModalMode('view');
                          }}
                        >
                          View
                        </Button>
                        {canUpdate && deal.status !== 'voided' && !deal.line_items?.length && (
                          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(deal)}>
                            Edit
                          </Button>
                        )}
                        {canVoid && deal.status !== 'voided' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Ban}
                            onClick={() => {
                              setSelected(deal);
                              setModalMode('void');
                            }}
                          >
                            Void
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filteredDeals.length && (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-xs text-slate-400">
                    No sales transactions match the selected payment filter or search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Statutory GST Invoice Modal */}
      <B2bInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        transaction={invoiceTransaction}
        customer={(customers || []).find((c) => c.id === invoiceTransaction?.customer_id)}
      />

      {/* New Invoice / Edit Modal */}
      <Modal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={() => setModalMode(null)}
        title={modalMode === 'create' ? 'Generate Statutory B2B Tax Invoice' : 'Edit Sales Transaction'}
      >
        <form onSubmit={submitTransaction} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="transactionReference"
              label="Invoice / PO Reference"
              placeholder="e.g. INV-2026-0089"
              value={form.externalReference}
              onChange={(event) => setForm({ ...form, externalReference: event.target.value })}
            />
            <Input
              id="transactionOccurredAt"
              label="Invoice Date & Time"
              type="datetime-local"
              value={form.occurredAt}
              onChange={(event) => setForm({ ...form, occurredAt: event.target.value })}
              required
            />
          </div>

          {modalMode === 'create' ? (
            <>
              {/* B2B Client Selector with Real-time Credit Limit Telemetry */}
              <div className="space-y-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-800/40">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Select B2B Client Account</span>
                  {selectedCustDetails && (
                    <span className="text-[10px] font-bold text-amber-400">
                      Credit Bal: ₹{Number(selectedCustDetails.outstanding_balance || 0).toLocaleString('en-IN')} / Limit: ₹{Number(selectedCustDetails.credit_limit || 250000).toLocaleString('en-IN')}
                    </span>
                  )}
                </label>
                <select
                  value={form.selectedCustomerId}
                  onChange={(e) => setForm({ ...form, selectedCustomerId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="">Walk-in / Direct Retail Counter Sale</option>
                  {(customers || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name || c.name} · GSTIN: {c.gstin || 'N/A'} · Route: {c.territory_route || 'Default'}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Payment Method
                    <select
                      value={form.paymentMethod}
                      onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                    >
                      <option value="upi">UPI / QR Code</option>
                      <option value="cash">Cash Counter</option>
                      <option value="bank_transfer">Bank Transfer (NEFT)</option>
                      <option value="other">Credit Ledger (Unpaid)</option>
                    </select>
                  </label>
                  <Input
                    id="transactionCreditTerms"
                    label="Credit Payment Terms"
                    value={form.creditTerms}
                    onChange={(e) => setForm({ ...form, creditTerms: e.target.value })}
                    placeholder="Net 30"
                  />
                </div>
              </div>

              {/* Product Line Items */}
              <div className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Order Line Items & SKUs</p>
                    <p className="text-xs text-slate-500">Stock is validated and updated upon confirmation.</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" icon={PackagePlus} onClick={addLine}>
                    Add Line Item
                  </Button>
                </div>
                {form.items.map((item, index) => {
                  const selectedProduct = catalog.find((product) => product.product_id === item.productId);
                  return (
                    <div key={index} className="grid gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 sm:grid-cols-12">
                      <label className="text-xs font-semibold sm:col-span-5">
                        Product / SKU
                        <select
                          required
                          value={item.productId}
                          onChange={(event) => updateLine(index, 'productId', event.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                        >
                          <option value="">Select Product SKU</option>
                          {catalog.map((product) => (
                            <option
                              key={product.product_id}
                              value={product.product_id}
                              disabled={form.items.some((line, lineIndex) => lineIndex !== index && line.productId === product.product_id)}
                            >
                              {product.name} · {product.sku} · Stock: {product.available_stock}
                            </option>
                          ))}
                        </select>
                        {selectedProduct && (
                          <p className="mt-1 text-[11px] text-slate-500">Available: {selectedProduct.available_stock} Units</p>
                        )}
                      </label>
                      <div className="sm:col-span-2">
                        <Input
                          label="Qty"
                          type="number"
                          min="1"
                          max={selectedProduct?.available_stock || undefined}
                          value={item.quantity}
                          onChange={(event) => updateLine(index, 'quantity', event.target.value)}
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          label="Unit Price (₹)"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(event) => updateLine(index, 'unitPrice', event.target.value)}
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          label="Discount (₹)"
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discountAmount}
                          onChange={(event) => updateLine(index, 'discountAmount', event.target.value)}
                        />
                      </div>
                      <div className="flex items-end sm:col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          icon={Trash2}
                          disabled={form.items.length === 1}
                          onClick={() => removeLine(index)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Total & GST Calculation summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  id="transactionDiscount"
                  label="Order Discount (₹)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.orderDiscount}
                  onChange={(event) => setForm({ ...form, orderDiscount: event.target.value })}
                />
                <Input
                  id="transactionTax"
                  label="Tax GST (18%)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={orderSummary.tax.toFixed(2)}
                  disabled
                />
                <Input
                  id="transactionCurrency"
                  label="Currency"
                  value={form.currency}
                  onChange={(event) => setForm({ ...form, currency: event.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-3.5 text-xs">
                <div>
                  <p className="text-slate-500">Total Units</p>
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{orderSummary.quantity} Pcs</p>
                </div>
                <div>
                  <p className="text-slate-500">Subtotal</p>
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    ₹{orderSummary.subtotal.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Final Invoice Total</p>
                  <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                    ₹{orderSummary.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                id="transactionAmount"
                label="Amount"
                type="number"
                value={form.totalAmount}
                onChange={(event) => setForm({ ...form, totalAmount: event.target.value })}
                required
              />
              <Input
                id="transactionItems"
                label="Item Count"
                type="number"
                value={form.itemCount}
                onChange={(event) => setForm({ ...form, itemCount: event.target.value })}
                required
              />
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Payment Status
                <select
                  value={form.paymentStatus}
                  onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid / Credit</option>
                  <option value="overdue">Overdue</option>
                </select>
              </label>
            </div>
          )}

          <Input
            id="transactionNotes"
            label="Notes / B2B Delivery Instructions"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalMode(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Save Transaction
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={modalMode === 'view'} onClose={() => setModalMode(null)} title="B2B Transaction & Tax Details">
        {selected && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-slate-500">Invoice Reference</dt>
                <dd className="font-bold text-slate-900 dark:text-slate-100">{selected.displayReference}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Sales Channel</dt>
                <dd className="font-semibold">{selected.source_system}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Invoice Total</dt>
                <dd className="font-bold text-indigo-500">{selected.formattedAmount}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Item Quantity</dt>
                <dd className="font-semibold">{selected.item_count} Units</dd>
              </div>
              <div>
                <dt className="text-slate-500">Payment Status</dt>
                <dd className="font-semibold uppercase text-emerald-500">{selected.payment_status || 'Paid'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Transaction Date</dt>
                <dd className="font-semibold">{new Date(selected.occurred_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Payment Method</dt>
                <dd className="font-semibold uppercase">{selected.payment_method?.replace('_', ' ') || 'UPI'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Credit Terms</dt>
                <dd className="font-semibold">{selected.credit_terms || 'Net 30'}</dd>
              </div>
            </dl>

            {selected.line_items?.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="grid grid-cols-4 bg-slate-50 p-2.5 text-xs font-bold dark:bg-slate-800">
                  <span>Product</span>
                  <span>Qty</span>
                  <span>Unit Price</span>
                  <span>Line Total</span>
                </div>
                {selected.line_items.map((line) => (
                  <div key={line.id} className="grid grid-cols-4 border-t border-slate-100 p-2.5 text-xs dark:border-slate-800">
                    <span>
                      {line.product?.name || 'Product'}
                      <small className="block text-slate-500 font-mono">{line.product?.sku}</small>
                    </span>
                    <span>{line.quantity}</span>
                    <span>₹{Number(line.unit_price || 0).toLocaleString('en-IN')}</span>
                    <span className="font-bold">₹{Number(line.line_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Void Modal */}
      <Modal isOpen={modalMode === 'void'} onClose={() => setModalMode(null)} title="Void Transaction">
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Are you sure you want to void transaction <strong>{selected?.displayReference}</strong>? This action will be recorded in
          the audit log and cannot be undone.
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <Button type="button" variant="ghost" onClick={() => setModalMode(null)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" isLoading={isSaving} onClick={voidTransaction}>
            Confirm Void
          </Button>
        </div>
      </Modal>
    </div>
  );
};
