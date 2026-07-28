import { useState } from 'react'
import { invoices, recentTransactions } from '../data/mockData'
import { Card, SectionHeader, Badge, Table, Tr, Td, Select, PageHeader, Btn } from '../components/ui'
import { useTheme } from '../components/Layout'

export default function Invoices() {
  const { dark } = useTheme()
  const [selectedInvoice, setSelectedInvoice] = useState(invoices[0])

  const total = invoices.reduce((s, i) => s + i.amount, 0)
  const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const pending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0)
  const overdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)

  return (
    <div>
      <PageHeader
        title="Invoices & Transactions"
        subtitle="Billing management, payment tracking, and transaction history"
        actions={<><Btn variant="outline">↓ Export</Btn><Btn>+ New Invoice</Btn></>}
      />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { l: 'Total Invoiced', v: `$${(total / 1000).toFixed(1)}K`, c: '#2563eb', icon: '📄' },
          { l: 'Paid', v: `$${(paid / 1000).toFixed(1)}K`, c: '#22c55e', icon: '✓' },
          { l: 'Pending', v: `$${(pending / 1000).toFixed(1)}K`, c: '#f59e0b', icon: '⏳' },
          { l: 'Overdue', v: `$${(overdue / 1000).toFixed(1)}K`, c: '#ef4444', icon: '⚠' },
        ].map(k => (
          <Card key={k.l} style={{ padding: 18, borderTop: `3px solid ${k.c}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{k.l}</p>
                <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: k.c }}>{k.v}</p>
              </div>
              <span style={{ fontSize: 20 }}>{k.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14, marginBottom: 14 }}>
        {/* Invoice List */}
        <Card>
          <div style={{ padding: '20px 20px 0' }}>
            <SectionHeader title="Invoices" subtitle={`${invoices.length} total`} action={
              <div style={{ display: 'flex', gap: 8 }}>
                <Select label="Status" options={['Paid', 'Pending', 'Overdue', 'Draft']} />
                <Select label="Date" options={['This month', 'Last month', 'Last quarter']} />
              </div>
            } />
          </div>
          <Table headers={['Invoice ID', 'Customer', 'Items', 'Amount', 'Issued', 'Due', 'Status', '']}>
            {invoices.map(inv => (
              <Tr key={inv.id} onClick={() => setSelectedInvoice(inv)}>
                <Td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#2563eb', fontWeight: 600 }}>{inv.id}</span></Td>
                <Td><span style={{ fontWeight: 500 }}>{inv.customer}</span></Td>
                <Td style={{ color: dark ? '#64748b' : '#94a3b8', fontSize: 12 }}>{inv.items} items</Td>
                <Td><span style={{ fontWeight: 700, fontSize: 14 }}>${inv.amount.toLocaleString('en', { minimumFractionDigits: 2 })}</span></Td>
                <Td style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8' }}>{inv.issued}</Td>
                <Td style={{ fontSize: 12, color: inv.status === 'overdue' ? '#ef4444' : (dark ? '#64748b' : '#94a3b8') }}>{inv.due}</Td>
                <Td><Badge status={inv.status} /></Td>
                <Td>
                  <button style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'transparent', color: '#2563eb', cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>View</button>
                </Td>
              </Tr>
            ))}
          </Table>
          <div style={{ height: 16 }} />
        </Card>

        {/* Invoice Preview */}
        <Card style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Invoice Preview</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: dark ? '#f8fafc' : '#0f172a', margin: 0, fontFamily: 'monospace' }}>{selectedInvoice.id}</p>
            </div>
            <Badge status={selectedInvoice.status} />
          </div>

          {/* Mini brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: dark ? '1px solid #334155' : '1px solid #f1f5f9' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #2563eb, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: dark ? '#f8fafc' : '#0f172a' }}>MarketMind AI</p>
              <p style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8', margin: 0 }}>accounts@marketmind.ai</p>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8', margin: '0 0 4px', fontWeight: 500 }}>BILLED TO</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: dark ? '#f8fafc' : '#0f172a', margin: '0 0 2px' }}>{selectedInvoice.customer}</p>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            {[['Issue Date', selectedInvoice.issued], ['Due Date', selectedInvoice.due], ['Items', `${selectedInvoice.items}`]].map(([l, v]) => (
              <div key={l}>
                <p style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8', margin: '0 0 2px', fontWeight: 500 }}>{l}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: dark ? '#f8fafc' : '#0f172a', margin: 0 }}>{v}</p>
              </div>
            ))}
          </div>

          {/* Line items placeholder */}
          <div style={{ background: dark ? '#0f172a' : '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            {[['Platform subscription', '$8,400.00'], ['Setup & onboarding', '$2,800.00'], ['API access (premium)', '$3,080.00']].slice(0, Math.min(3, selectedInvoice.items)).map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: dark ? '1px solid #1e293b' : '1px solid #e2e8f0', fontSize: 12 }}>
                <span style={{ color: dark ? '#94a3b8' : '#475569' }}>{l}</span>
                <span style={{ fontWeight: 600, color: dark ? '#f8fafc' : '#0f172a' }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: dark ? '2px solid #334155' : '2px solid #e2e8f0', marginBottom: 20 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: dark ? '#f8fafc' : '#0f172a' }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>${selectedInvoice.amount.toLocaleString('en', { minimumFractionDigits: 2 })}</span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Btn style={{ flex: 1, justifyContent: 'center' }}>Send Invoice</Btn>
            <Btn variant="outline" style={{ padding: '8px 14px' }}>↓ PDF</Btn>
          </div>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <div style={{ padding: '20px 20px 0' }}>
          <SectionHeader title="Transaction History" subtitle="All payment events" action={<Btn variant="outline" style={{ fontSize: 12, padding: '5px 12px' }}>↓ Export CSV</Btn>} />
        </div>
        <Table headers={['Transaction ID', 'Customer', 'Amount', 'Status', 'Date', 'Payment Method']}>
          {recentTransactions.map(t => (
            <Tr key={t.id}>
              <Td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#2563eb' }}>{t.id}</span></Td>
              <Td><span style={{ fontWeight: 500 }}>{t.customer}</span></Td>
              <Td><span style={{ fontWeight: 600 }}>${t.amount.toFixed(2)}</span></Td>
              <Td><Badge status={t.status} /></Td>
              <Td style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8' }}>{t.date}</Td>
              <Td style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8' }}>{t.method}</Td>
            </Tr>
          ))}
        </Table>
        <div style={{ height: 16 }} />
      </Card>
    </div>
  )
}
