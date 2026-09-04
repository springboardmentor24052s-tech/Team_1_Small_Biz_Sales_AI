import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Printer, Building2, Phone, Mail, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const B2bInvoiceModal = ({ isOpen, onClose, transaction, customer }) => {
  const { t } = useLanguage();

  if (!isOpen || !transaction) return null;

  const invoiceNo = transaction.external_reference || `INV-2026-${transaction.id ? transaction.id.slice(0, 6).toUpperCase() : '001'}`;
  const invDate = transaction.occurred_at ? new Date(transaction.occurred_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const dueDate = transaction.due_date ? new Date(transaction.due_date).toLocaleDateString('en-IN') : 'Net 30 Days';

  const companyName = customer?.company_name || transaction.customer_snapshot?.company_name || 'Apex Wholesale & Retail Partner';
  const gstin = customer?.gstin || transaction.customer_snapshot?.gstin || '27AAAAA0000A1Z5';
  const contactPhone = customer?.contact_phone || '+91 98765 43210';
  const contactEmail = customer?.contact_email || 'billing@partner.com';

  const totalAmount = Number(transaction.total_amount || 0);
  const cgst = Number(transaction.cgst_amount || (totalAmount * 0.09));
  const sgst = Number(transaction.sgst_amount || (totalAmount * 0.09));
  const subtotal = totalAmount - (cgst + sgst);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('B2B GST Tax Invoice & Ledger Statement')} size="xl">
      <div className="space-y-6 text-slate-200 print:text-black print:bg-white print:p-4 font-sans">
        
        {/* Top Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
              transaction.payment_status === 'overdue' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
              transaction.payment_status === 'unpaid' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {transaction.payment_status === 'overdue' ? 'Overdue Payment' : transaction.payment_status === 'unpaid' ? 'Credit Ledger (Unpaid)' : 'Paid Tax Invoice'}
            </span>
            <span className="text-xs text-slate-400 font-medium">Terms: {transaction.credit_terms || 'Net 30'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1.5 text-xs">
              <Printer className="w-4 h-4 text-indigo-400" />
              <span>Print Tax Invoice</span>
            </Button>
          </div>
        </div>

        {/* Invoice Printable Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/60 print:bg-white p-5 rounded-xl border border-slate-800 print:border-black">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-lg">
              <Building2 className="w-6 h-6" />
              <span>MarketMind Enterprise Distribution</span>
            </div>
            <p className="text-xs text-slate-400 print:text-black mt-1">Authorized B2B FMCG & Wholesale Distributor</p>
            <p className="text-xs text-slate-400 print:text-black mt-0.5">GSTIN: <span className="font-semibold text-slate-200 print:text-black">27MARKETMIND123Z9</span></p>
            <p className="text-xs text-slate-400 print:text-black">State Code: 27 (Maharashtra) | HSN/SAC: 8471</p>
          </div>

          <div className="md:text-right space-y-1">
            <h2 className="text-xl font-extrabold text-white print:text-black tracking-tight">GST TAX INVOICE</h2>
            <p className="text-xs text-indigo-300 print:text-black font-semibold">Invoice No: {invoiceNo}</p>
            <p className="text-xs text-slate-400 print:text-black">Invoice Date: {invDate}</p>
            <p className="text-xs text-slate-400 print:text-black">Payment Due Date: <span className="font-semibold text-amber-400 print:text-black">{dueDate}</span></p>
          </div>
        </div>

        {/* Bill To & B2B Customer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-900/40 border border-slate-800 print:border-black">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Billed To (Client Account):</span>
            <h4 className="text-base font-bold text-white print:text-black mt-0.5">{companyName}</h4>
            <p className="text-xs text-slate-300 print:text-black">GSTIN: <span className="font-semibold text-indigo-300 print:text-black">{gstin}</span></p>
            <p className="text-xs text-slate-400 print:text-black mt-0.5 flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-slate-400" /> {contactPhone}
            </p>
            <p className="text-xs text-slate-400 print:text-black flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-slate-400" /> {contactEmail}
            </p>
          </div>

          <div className="space-y-1 text-xs text-slate-300 print:text-black md:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Commercial Credit Ledger:</span>
            <p className="mt-0.5">Credit Terms: <span className="font-semibold text-white print:text-black">{transaction.credit_terms || 'Net 30 Days'}</span></p>
            <p>Dispatch Route: <span className="font-semibold text-slate-200 print:text-black">{customer?.territory_route || 'Central Wholesale Route'}</span></p>
            <p>Payment Mode: <span className="font-semibold text-slate-200 print:text-black">{transaction.payment_method || 'NEFT / RTGS Transfer'}</span></p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-black">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 print:bg-slate-200 print:text-black font-semibold border-b border-slate-800 print:border-black">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Item Particulars</th>
                <th className="p-3">HSN Code</th>
                <th className="p-3">Batch / Lot</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Rate (₹)</th>
                <th className="p-3 text-right">Taxable Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 print:divide-slate-300">
              {(transaction.line_items && transaction.line_items.length > 0 ? transaction.line_items : [
                { id: '1', product: { name: 'Wholesale B2B Order Package', sku: 'B2B-PKG-01' }, quantity: transaction.item_count || 1, unit_price: subtotal / (transaction.item_count || 1), line_amount: subtotal }
              ]).map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-800/30">
                  <td className="p-3 text-slate-400">{idx + 1}</td>
                  <td className="p-3">
                    <p className="font-semibold text-white print:text-black">{item.product?.name || 'Wholesale Product'}</p>
                    <p className="text-[10px] text-slate-400 print:text-black">SKU: {item.product?.sku || 'SKU-DEMO'}</p>
                  </td>
                  <td className="p-3 text-slate-400">8471</td>
                  <td className="p-3 text-slate-400 font-mono text-[11px]">BATCH-2026-X1</td>
                  <td className="p-3 text-right font-medium text-white print:text-black">{item.quantity}</td>
                  <td className="p-3 text-right font-medium text-slate-300 print:text-black">₹{Number(item.unit_price || (item.line_amount / item.quantity)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right font-bold text-white print:text-black">₹{Number(item.line_amount || (item.quantity * item.unit_price)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* GST Tax Calculation Breakdown */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800 print:border-black">
          <div className="text-xs text-slate-400 space-y-1.5 max-w-md">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>GST Statutory Declaration & Authorization</span>
            </div>
            <p className="text-[11px]">We declare that this tax invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
            <div className="pt-3 print:pt-8 text-[11px] text-slate-400">
              <p>Authorized Signatory: _______________________</p>
            </div>
          </div>

          <div className="w-full md:w-64 space-y-2 text-xs border-t md:border-t-0 md:border-l border-slate-800 print:border-black pt-3 md:pt-0 md:pl-6">
            <div className="flex justify-between text-slate-300 print:text-black">
              <span>Taxable Subtotal:</span>
              <span className="font-semibold">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-400 print:text-black">
              <span>CGST (9%):</span>
              <span>₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-400 print:text-black">
              <span>SGST (9%):</span>
              <span>₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white print:text-black pt-2 border-t border-slate-700 print:border-black">
              <span>Invoice Total:</span>
              <span className="text-indigo-400 print:text-black">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
};
