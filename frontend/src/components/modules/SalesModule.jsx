import React, { useMemo, useState } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Search, Plus, FileText, Download, Pencil, Ban, PackagePlus, Trash2 } from 'lucide-react';

const emptyForm = () => ({
  externalReference: '',
  occurredAt: new Date().toISOString().slice(0, 16),
  currency: 'INR',
  totalAmount: '',
  itemCount: '1',
  customerReference: '',
  paymentMethod: 'upi',
  orderDiscount: '0',
  taxAmount: '0',
  items: [{ productId: '', quantity: '1', unitPrice: '', discountAmount: '0' }],
  notes: ''
});

export const SalesModule = () => {
  const { addToast } = useToast();
  const { salesTransactions, refresh } = useData();
  const { api, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [catalog, setCatalog] = useState([]);

  const permissions = useMemo(
    () => new Set(profile?.role?.permissions || []),
    [profile?.role?.permissions]
  );
  const canCreate = permissions.has('sales.create') && Boolean(profile?.store_id);
  const canUpdate =
    permissions.has('sales.update.store') || permissions.has('sales.update.own');
  const canVoid = permissions.has('sales.void');

  const deals = salesTransactions.map((transaction) => ({
    ...transaction,
    displayReference: transaction.external_reference || transaction.id.slice(0, 8),
    amount: new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: transaction.currency
    }).format(Number(transaction.total_amount))
  }));
  const filteredDeals = deals.filter((deal) =>
    `${deal.displayReference} ${deal.source_system}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const orderSummary = useMemo(() => {
    const subtotal = form.items.reduce((sum, item) => sum + Math.max(0, Number(item.unitPrice || 0) * Number(item.quantity || 0) - Number(item.discountAmount || 0)), 0);
    const total = subtotal - Number(form.orderDiscount || 0) + Number(form.taxAmount || 0);
    return { subtotal, total, quantity: form.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) };
  }, [form.items, form.orderDiscount, form.taxAmount]);

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
    } catch (error) { addToast(error.message, 'danger'); }
  };

  const openEdit = (transaction) => {
    setSelected(transaction);
    setForm({
      externalReference: transaction.external_reference || '',
      occurredAt: new Date(transaction.occurred_at).toISOString().slice(0, 16),
      currency: transaction.currency,
      totalAmount: String(transaction.total_amount),
      itemCount: String(transaction.item_count),
      notes: transaction.notes || ''
    });
    setModalMode('edit');
  };

  const submitTransaction = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        external_reference: form.externalReference.trim() || null,
        occurred_at: new Date(form.occurredAt).toISOString(),
        total_amount: Number(form.totalAmount),
        item_count: Number(form.itemCount),
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
            customer_reference: form.customerReference.trim() || null,
            order_discount: Number(form.orderDiscount || 0),
            tax_amount: Number(form.taxAmount || 0),
            notes: payload.notes,
            items: form.items.map((item) => ({
              product_id: item.productId,
              quantity: Number(item.quantity),
              unit_price: Number(item.unitPrice),
              discount_amount: Number(item.discountAmount || 0)
            }))
          })
        });
        addToast('Sale recorded. Inventory and customer totals were updated.', 'success');
      } else {
        await api(`/sales/transactions/${selected.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        addToast('Sales transaction updated.', 'success');
      }
      setModalMode(null);
      await refresh();
    } catch (error) {
      addToast(error.message, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const updateLine = (index, field, value) => setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  const addLine = () => setForm((current) => ({ ...current, items: [...current.items, { productId: '', quantity: '1', unitPrice: '', discountAmount: '0' }] }));
  const removeLine = (index) => setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }));

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
    const header = ['reference', 'occurred_at', 'amount', 'currency', 'items', 'status'];
    const rows = deals.map((deal) => [
      deal.displayReference,
      deal.occurred_at,
      deal.total_amount,
      deal.currency,
      deal.item_count,
      deal.status
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'marketmind-sales-ledger.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-500" />
            <span>Sales & Transaction Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review imported orders and manage permitted manual transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={exportLedger}>
            Export Ledger
          </Button>
          {canCreate && (
            <Button variant="primary" size="sm" icon={Plus} onClick={openCreate}>
              New Transaction
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search transaction reference..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold">{deal.displayReference}</td>
                  <td className="py-3 px-4 text-slate-500">{deal.source_system}</td>
                  <td className="py-3 px-4 font-bold text-indigo-600">{deal.amount}</td>
                  <td className="py-3 px-4"><Badge variant="info">{deal.status}</Badge></td>
                  <td className="py-3 px-4 font-semibold text-emerald-600">{deal.item_count}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-1">
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={() => setModalMode(null)}
        title={modalMode === 'create' ? 'Create Sales Transaction' : 'Edit Sales Transaction'}
      >
        <form onSubmit={submitTransaction} className="space-y-4">
          <Input
            id="transactionReference"
            label="External Reference"
            value={form.externalReference}
            onChange={(event) => setForm({ ...form, externalReference: event.target.value })}
          />
          <Input
            id="transactionOccurredAt"
            label="Occurred At"
            type="datetime-local"
            value={form.occurredAt}
            onChange={(event) => setForm({ ...form, occurredAt: event.target.value })}
            required
          />
          {modalMode === 'create' ? <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input id="transactionCustomer" label="Customer Reference (optional)" placeholder="CUSTOMER-001" value={form.customerReference} onChange={(event) => setForm({ ...form, customerReference: event.target.value })} />
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Payment Method<select value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-700"><option value="upi">UPI</option><option value="cash">Cash</option><option value="card">Card</option><option value="bank_transfer">Bank transfer</option><option value="other">Other</option></select></label>
            </div>
            <div className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between"><div><p className="text-sm font-bold">Products sold</p><p className="text-xs text-slate-500">Stock is checked and deducted only after the whole order is valid.</p></div><Button type="button" size="sm" variant="outline" icon={PackagePlus} onClick={addLine}>Add Product</Button></div>
              {form.items.map((item, index) => {
                const selectedProduct = catalog.find((product) => product.product_id === item.productId);
                return <div key={index} className="grid gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 sm:grid-cols-12">
                  <label className="text-xs font-semibold sm:col-span-5">Product / SKU<select required value={item.productId} onChange={(event) => updateLine(index, 'productId', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="">Select product</option>{catalog.map((product) => <option key={product.product_id} value={product.product_id} disabled={form.items.some((line, lineIndex) => lineIndex !== index && line.productId === product.product_id)}>{product.name} · {product.sku} · stock {product.available_stock}</option>)}</select>{selectedProduct && <p className="mt-1 text-[11px] text-slate-500">Available: {selectedProduct.available_stock}</p>}</label>
                  <div className="sm:col-span-2"><Input label="Quantity" type="number" min="1" max={selectedProduct?.available_stock || undefined} value={item.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} required /></div>
                  <div className="sm:col-span-2"><Input label="Unit Price (₹)" type="number" min="0.01" step="0.01" value={item.unitPrice} onChange={(event) => updateLine(index, 'unitPrice', event.target.value)} required /></div>
                  <div className="sm:col-span-2"><Input label="Line Discount (₹)" type="number" min="0" step="0.01" value={item.discountAmount} onChange={(event) => updateLine(index, 'discountAmount', event.target.value)} /></div>
                  <div className="flex items-end sm:col-span-1"><Button type="button" variant="ghost" icon={Trash2} disabled={form.items.length === 1} onClick={() => removeLine(index)} /></div>
                </div>;
              })}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input id="transactionDiscount" label="Order Discount (₹)" type="number" min="0" step="0.01" value={form.orderDiscount} onChange={(event) => setForm({ ...form, orderDiscount: event.target.value })} />
              <Input id="transactionTax" label="Tax (₹)" type="number" min="0" step="0.01" value={form.taxAmount} onChange={(event) => setForm({ ...form, taxAmount: event.target.value })} />
              <Input id="transactionCurrency" label="Currency" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} required />
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-indigo-50 p-3 text-sm dark:bg-indigo-950/30"><div><p className="text-xs text-slate-500">Units</p><p className="font-bold">{orderSummary.quantity}</p></div><div><p className="text-xs text-slate-500">Subtotal</p><p className="font-bold">₹{orderSummary.subtotal.toLocaleString('en-IN')}</p></div><div><p className="text-xs text-slate-500">Final total</p><p className="font-bold text-indigo-600 dark:text-indigo-300">₹{orderSummary.total.toLocaleString('en-IN')}</p></div></div>
          </> : <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <Input
              id="transactionCurrency"
              label="Currency"
              value={form.currency}
              onChange={(event) => setForm({ ...form, currency: event.target.value })}
              required
            />
          </div>}
          <Input
            id="transactionNotes"
            label="Notes"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalMode(null)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>Save Transaction</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalMode === 'view'} onClose={() => setModalMode(null)} title="Transaction Details">
        {selected && (
          <div className="space-y-4"><dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-slate-500">Reference</dt><dd className="font-semibold">{selected.displayReference}</dd></div>
            <div><dt className="text-slate-500">Source</dt><dd className="font-semibold">{selected.source_system}</dd></div>
            <div><dt className="text-slate-500">Amount</dt><dd className="font-semibold">{selected.amount}</dd></div>
            <div><dt className="text-slate-500">Items</dt><dd className="font-semibold">{selected.item_count}</dd></div>
            <div><dt className="text-slate-500">Status</dt><dd className="font-semibold">{selected.status}</dd></div>
            <div><dt className="text-slate-500">Date</dt><dd className="font-semibold">{new Date(selected.occurred_at).toLocaleString()}</dd></div>
            <div><dt className="text-slate-500">Payment</dt><dd className="font-semibold capitalize">{selected.payment_method?.replace('_', ' ') || 'Not recorded'}</dd></div>
            <div><dt className="text-slate-500">Customer</dt><dd className="font-semibold">{selected.customer_id || 'Walk-in / not recorded'}</dd></div>
          </dl>{selected.line_items?.length > 0 && <div className="rounded-xl border border-slate-200 dark:border-slate-800"><div className="grid grid-cols-4 bg-slate-50 p-2 text-xs font-bold dark:bg-slate-800"><span>Product</span><span>Qty</span><span>Unit price</span><span>Line total</span></div>{selected.line_items.map((line) => <div key={line.id} className="grid grid-cols-4 border-t border-slate-100 p-2 text-xs dark:border-slate-800"><span>{line.product.name}<small className="block text-slate-500">{line.product.sku}</small></span><span>{line.quantity}</span><span>₹{Number(line.unit_price).toLocaleString('en-IN')}</span><span>₹{Number(line.line_amount).toLocaleString('en-IN')}</span></div>)}</div>}</div>
        )}
      </Modal>

      <Modal isOpen={modalMode === 'void'} onClose={() => setModalMode(null)} title="Void Transaction">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Void transaction <strong>{selected?.displayReference}</strong>? This action is recorded in
          the audit trail and the transaction cannot be edited afterward.
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <Button type="button" variant="ghost" onClick={() => setModalMode(null)}>Cancel</Button>
          <Button type="button" variant="danger" isLoading={isSaving} onClick={voidTransaction}>
            Confirm Void
          </Button>
        </div>
      </Modal>
    </div>
  );
};
