import React, { useMemo, useState } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Search, Plus, FileText, Download, Pencil, Ban } from 'lucide-react';

const emptyForm = () => ({
  externalReference: '',
  occurredAt: new Date().toISOString().slice(0, 16),
  currency: 'INR',
  totalAmount: '',
  itemCount: '1',
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

  const openCreate = () => {
    if (!canCreate) {
      addToast('Your role or store assignment does not allow transaction creation.', 'danger');
      return;
    }
    setSelected(null);
    setForm(emptyForm());
    setModalMode('create');
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
            ...payload,
            store_id: profile.store_id,
            currency: form.currency.toUpperCase()
          })
        });
        addToast('Sales transaction created.', 'success');
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
                      {canUpdate && deal.status !== 'voided' && (
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
            <Input
              id="transactionCurrency"
              label="Currency"
              value={form.currency}
              onChange={(event) => setForm({ ...form, currency: event.target.value })}
              required
            />
          </div>
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
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-slate-500">Reference</dt><dd className="font-semibold">{selected.displayReference}</dd></div>
            <div><dt className="text-slate-500">Source</dt><dd className="font-semibold">{selected.source_system}</dd></div>
            <div><dt className="text-slate-500">Amount</dt><dd className="font-semibold">{selected.amount}</dd></div>
            <div><dt className="text-slate-500">Items</dt><dd className="font-semibold">{selected.item_count}</dd></div>
            <div><dt className="text-slate-500">Status</dt><dd className="font-semibold">{selected.status}</dd></div>
            <div><dt className="text-slate-500">Date</dt><dd className="font-semibold">{new Date(selected.occurred_at).toLocaleString()}</dd></div>
          </dl>
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
