import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Printer, Building2, Phone, Mail, ShieldCheck, CheckCircle2, AlertTriangle, Clock, QrCode } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const numberToWordsIN = (num) => {
  if (!num || isNaN(num)) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 ? inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 ? inWords(n % 10000000) : '');
  };

  const integerPart = Math.floor(num);
  return `${inWords(integerPart).trim()} Rupees Only`;
};

export const B2bInvoiceModal = ({ isOpen, onClose, transaction, customer }) => {
  const { t } = useLanguage();

  if (!isOpen || !transaction) return null;

  const invoiceNo = transaction.external_reference || `INV-2026-${transaction.id ? transaction.id.slice(0, 6).toUpperCase() : '0045'}`;
  const invDate = transaction.occurred_at ? new Date(transaction.occurred_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const dueDate = transaction.due_date ? new Date(transaction.due_date).toLocaleDateString('en-IN') : 'Net 30 Days';

  const companyName = customer?.company_name || transaction.customer_snapshot?.company_name || transaction.customer_reference || 'Apex Wholesale & Retail Partner';
  const gstin = customer?.gstin || transaction.customer_snapshot?.gstin || '27AAAAA0000A1Z5';
  const contactPhone = customer?.contact_phone || '+91 98765 43210';
  const contactEmail = customer?.contact_email || 'billing@retailpartner.in';
  const route = customer?.territory_route || 'Central Wholesale Corridor';

  const totalAmount = Number(transaction.total_amount || 0);
  const cgst = Number(transaction.cgst_amount || (totalAmount * 0.09));
  const sgst = Number(transaction.sgst_amount || (totalAmount * 0.09));
  const taxableSubtotal = totalAmount - (cgst + sgst);
  const totalItemCount = transaction.item_count || 1;

  const handlePrint = () => {
    window.print();
  };

  const rawLineItems = transaction.line_items && transaction.line_items.length > 0 ? transaction.line_items : [
    { id: '1', product: { name: 'Classic T-Shirt', sku: 'DEMO-TSHIRT' }, quantity: 3, unit_price: 988, line_amount: 2964 },
    { id: '2', product: { name: 'Steel Water Bottle', sku: 'DEMO-BOTTLE' }, quantity: 2, unit_price: 988, line_amount: 1976 }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('B2B Statutory GST Tax Invoice')} size="xl">
      <div className="space-y-6 text-slate-900 dark:text-slate-100 print:text-black print:bg-white font-sans text-xs">
        
        {/* Top Control Bar (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 border ${
              transaction.payment_status === 'overdue' ? 'bg-rose-500/15 text-rose-500 border-rose-500/30' :
              transaction.payment_status === 'unpaid' ? 'bg-amber-500/15 text-amber-500 border-amber-500/30' :
              'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
            }`}>
              {transaction.payment_status === 'overdue' && <AlertTriangle className="w-3.5 h-3.5" />}
              {transaction.payment_status === 'unpaid' && <Clock className="w-3.5 h-3.5" />}
              {transaction.payment_status === 'paid' && <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{transaction.payment_status === 'overdue' ? 'OVERDUE PAYMENT' : transaction.payment_status === 'unpaid' ? 'CREDIT LEDGER (UNPAID)' : 'PAID TAX INVOICE'}</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Payment Method: <strong>{transaction.payment_method?.toUpperCase() || 'UPI / BANK'}</strong></span>
          </div>

          <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint} className="shadow-lg shadow-indigo-500/20">
            Print Official GST Bill
          </Button>
        </div>

        {/* Real Bill Paper Sheet Frame */}
        <div className="bg-white text-slate-900 p-6 rounded-2xl shadow-xl border border-slate-300 print:shadow-none print:border-black print:p-0 space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b-2 border-slate-900 gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 font-black text-xl tracking-tight">
                <Building2 className="w-6 h-6" />
                <span>MARKETMIND DISTRIBUTORS PVT LTD</span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">Authorised B2B Wholesale FMCG & Retail Distribution Network</p>
              <p className="text-[11px] text-slate-500 mt-1">Plot 45, MIDC Commercial Zone, Andheri East, Mumbai - 400093</p>
              <p className="text-[11px] text-slate-700 font-semibold mt-0.5">
                GSTIN: <span className="font-mono text-indigo-900">27MARKETMIND123Z9</span> | State Code: 27 (Maharashtra)
              </p>
            </div>

            <div className="text-left sm:text-right border-l-2 sm:border-l-0 sm:pl-0 pl-3 border-indigo-600">
              <span className="inline-block px-3 py-1 bg-indigo-900 text-white font-black text-xs uppercase tracking-widest rounded">
                TAX INVOICE
              </span>
              <p className="text-xs text-slate-700 font-bold mt-2">Invoice No: <span className="font-mono text-indigo-900 text-sm">{invoiceNo}</span></p>
              <p className="text-[11px] text-slate-600">Invoice Date: <span className="font-semibold">{invDate}</span></p>
              <p className="text-[11px] text-slate-600">Credit Terms: <span className="font-semibold">{transaction.credit_terms || 'Net 30 Days'}</span></p>
              <p className="text-[11px] text-rose-700 font-bold">Due Date: <span>{dueDate}</span></p>
            </div>
          </div>

          {/* Billed To / Consignee Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">BILLED TO (BUYER DETAILS):</span>
              <h4 className="text-sm font-bold text-slate-900">{companyName}</h4>
              <p className="text-[11px] text-slate-700">GSTIN: <span className="font-mono font-bold text-indigo-900">{gstin}</span></p>
              <p className="text-[11px] text-slate-600">Delivery Route: <span className="font-semibold">{route}</span></p>
              <p className="text-[11px] text-slate-600 flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {contactPhone}</p>
              <p className="text-[11px] text-slate-600 flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {contactEmail}</p>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">DISPATCH & PAYMENT LEDGER:</span>
              <p className="text-[11px] text-slate-700">Dispatched Via: <span className="font-semibold">Distributor Route Vehicle</span></p>
              <p className="text-[11px] text-slate-700">Payment Mode: <span className="font-semibold">{transaction.payment_method?.toUpperCase() || 'UPI'}</span></p>
              <p className="text-[11px] text-slate-700">Payment Status: <span className="font-bold text-emerald-700 uppercase">{transaction.payment_status || 'PAID'}</span></p>
              <p className="text-[11px] text-slate-600 font-mono">Place of Supply: 27-Maharashtra</p>
            </div>
          </div>

          {/* Itemized Particulars Table */}
          <div className="overflow-x-auto border border-slate-300 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold text-[11px] border-b border-slate-900">
                <tr>
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5">Item Description & SKU</th>
                  <th className="p-2.5">HSN/SAC</th>
                  <th className="p-2.5">Batch / Lot</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Unit Price (₹)</th>
                  <th className="p-2.5 text-right">Taxable Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rawLineItems.map((item, idx) => {
                  const qty = Number(item.quantity || 1);
                  let calculatedRate = Number(item.unit_price || 0);
                  let lineTotal = Number(item.line_amount || 0);

                  if (calculatedRate === 0 && lineTotal > 0) {
                    calculatedRate = lineTotal / qty;
                  } else if (lineTotal === 0 && calculatedRate > 0) {
                    lineTotal = calculatedRate * qty;
                  } else if (calculatedRate === 0 && lineTotal === 0) {
                    calculatedRate = taxableSubtotal / totalItemCount;
                    lineTotal = calculatedRate * qty;
                  }

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50">
                      <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2.5">
                        <p className="font-bold text-slate-900">{item.product?.name || 'Wholesale Product'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">SKU: {item.product?.sku || 'SKU-8082'}</p>
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">8471</td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-600">BATCH-2026-X1</td>
                      <td className="p-2.5 text-center font-bold text-slate-900">{qty} Pcs</td>
                      <td className="p-2.5 text-right font-mono text-slate-800">
                        ₹{calculatedRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-2.5 text-right font-bold font-mono text-slate-900">
                        ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tax Calculation & Amount in Words */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-2">
            {/* Bank Details & QR */}
            <div className="md:col-span-7 space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">BANK PAYMENT & REMITTANCE DETAILS</p>
                  <p className="text-[11px] font-bold text-slate-900 mt-0.5">Account Name: MarketMind Wholesale Pvt Ltd</p>
                  <p className="text-[11px] text-slate-700">Bank: HDFC Bank · Fort Branch</p>
                  <p className="text-[11px] text-slate-700 font-mono">A/C No: 50200012345678 · IFSC: HDFC0000060</p>
                  <p className="text-[11px] text-indigo-900 font-bold font-mono">UPI ID: marketmind.pay@hdfcbank</p>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-300 flex flex-col items-center">
                  <QrCode className="w-10 h-10 text-slate-800" />
                  <span className="text-[8px] font-bold text-slate-500 mt-0.5">SCAN TO PAY</span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-200">
                <p className="text-[10px] font-bold text-slate-600">AMOUNT IN WORDS:</p>
                <p className="text-xs font-black text-indigo-950 italic">{numberToWordsIN(totalAmount)}</p>
              </div>
            </div>

            {/* Financial Summary Box */}
            <div className="md:col-span-5 space-y-2 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
              <div className="flex justify-between text-slate-700 font-medium">
                <span>Taxable Subtotal:</span>
                <span className="font-mono font-bold">₹{taxableSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Central GST (CGST 9%):</span>
                <span className="font-mono">₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>State GST (SGST 9%):</span>
                <span className="font-mono">₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center">
                <span className="font-black text-slate-900 text-sm">FINAL INVOICE TOTAL:</span>
                <span className="font-black font-mono text-indigo-950 text-base">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Footer & Declaration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-300 text-[10px] text-slate-500">
            <div className="space-y-1">
              <p className="font-bold text-slate-700">TERMS & CONDITIONS:</p>
              <p>1. Goods once sold will not be taken back or exchanged.</p>
              <p>2. Interest @ 18% p.a. will be charged if payment is delayed beyond credit due date.</p>
              <p>3. Subject to Mumbai Jurisdiction only. E.&O.E.</p>
            </div>
            
            <div className="sm:text-right space-y-8">
              <p className="font-bold text-slate-800">For MARKETMIND DISTRIBUTORS PVT LTD</p>
              <p className="text-slate-400 font-semibold pt-4">Authorized Signatory / Stamp</p>
            </div>
          </div>

        </div>

      </div>
    </Modal>
  );
};
