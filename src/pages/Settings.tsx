import { useState } from 'react'
import { Card, SectionHeader, PageHeader, Btn } from '../components/ui'
import { useTheme } from '../components/Layout'

const settingsSections = ['Profile', 'Notifications', 'API Configuration', 'Security', 'Theme & Appearance', 'Integrations']

export default function Settings() {
  const { dark, toggle } = useTheme()
  const [activeSection, setActiveSection] = useState('Profile')
  const [saved, setSaved] = useState(false)
  const [notifications, setNotifications] = useState({ email: true, push: true, slack: false, weekly: true, anomaly: true, forecast: false })
  const [twoFactor, setTwoFactor] = useState(false)
  const [apiVisible, setApiVisible] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button onClick={onChange} style={{ width: 40, height: 22, borderRadius: 11, border: 'none', background: checked ? '#2563eb' : (dark ? '#334155' : '#e2e8f0'), cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: checked ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  )

  const SettingRow = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: dark ? '1px solid #1e293b' : '1px solid #f1f5f9' }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 500, color: dark ? '#f8fafc' : '#0f172a', margin: 0 }}>{label}</p>
        {desc && <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: '3px 0 0' }}>{desc}</p>}
      </div>
      {children}
    </div>
  )

  const Input = ({ label, defaultValue, type = 'text' }: { label: string; defaultValue: string; type?: string }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: dark ? '#94a3b8' : '#475569', marginBottom: 6 }}>{label}</label>
      <input type={type} defaultValue={defaultValue} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: dark ? '1px solid #334155' : '1px solid #e2e8f0', background: dark ? '#0f172a' : '#f8fafc', color: dark ? '#f8fafc' : '#0f172a', fontSize: 14, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', outline: 'none' }} />
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'Profile':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, padding: 20, borderRadius: 12, background: dark ? '#0f172a' : '#f8fafc', border: dark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', flexShrink: 0 }}>PC</div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: dark ? '#f8fafc' : '#0f172a', margin: '0 0 4px' }}>Patricia Chen</p>
                <p style={{ fontSize: 13, color: dark ? '#64748b' : '#94a3b8', margin: '0 0 10px' }}>Business Owner · p.chen@marketmind.ai</p>
                <button style={{ fontSize: 12, padding: '5px 14px', borderRadius: 8, border: dark ? '1px solid #334155' : '1px solid #e2e8f0', background: 'transparent', color: '#2563eb', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>Change Photo</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              <Input label="First Name" defaultValue="Patricia" />
              <div style={{ paddingLeft: 16 }}><Input label="Last Name" defaultValue="Chen" /></div>
            </div>
            <Input label="Email Address" defaultValue="p.chen@marketmind.ai" type="email" />
            <Input label="Phone Number" defaultValue="+1 (415) 555-0192" />
            <Input label="Business Name" defaultValue="Chen Retail Group" />
            <Input label="Timezone" defaultValue="Pacific Time (PT) — UTC-7" />
          </div>
        )

      case 'Notifications':
        return (
          <div>
            <SectionHeader title="Email Notifications" subtitle="Configure what you receive via email" />
            <SettingRow label="Weekly digest" desc="Summary of key metrics every Monday morning"><Toggle checked={notifications.weekly} onChange={() => setNotifications(n => ({ ...n, weekly: !n.weekly }))} /></SettingRow>
            <SettingRow label="Anomaly alerts" desc="Immediate email when anomalies are detected"><Toggle checked={notifications.anomaly} onChange={() => setNotifications(n => ({ ...n, anomaly: !n.anomaly }))} /></SettingRow>
            <SettingRow label="Forecast reports" desc="New AI forecast reports available"><Toggle checked={notifications.forecast} onChange={() => setNotifications(n => ({ ...n, forecast: !n.forecast }))} /></SettingRow>
            <SettingRow label="Email notifications" desc="All platform notifications via email"><Toggle checked={notifications.email} onChange={() => setNotifications(n => ({ ...n, email: !n.email }))} /></SettingRow>

            <div style={{ height: 20 }} />
            <SectionHeader title="Push Notifications" subtitle="Browser and mobile push alerts" />
            <SettingRow label="Push notifications" desc="Real-time alerts in your browser"><Toggle checked={notifications.push} onChange={() => setNotifications(n => ({ ...n, push: !n.push }))} /></SettingRow>

            <div style={{ height: 20 }} />
            <SectionHeader title="Integrations" subtitle="Third-party notification channels" />
            <SettingRow label="Slack notifications" desc="Send alerts to your Slack workspace"><Toggle checked={notifications.slack} onChange={() => setNotifications(n => ({ ...n, slack: !n.slack }))} /></SettingRow>
            {notifications.slack && (
              <div style={{ padding: 16, borderRadius: 10, background: dark ? '#0f172a' : '#f8fafc', border: dark ? '1px solid #334155' : '1px solid #e2e8f0', marginTop: 8 }}>
                <Input label="Slack Webhook URL" defaultValue="https://hooks.slack.com/services/..." />
              </div>
            )}
          </div>
        )

      case 'API Configuration':
        return (
          <div>
            <SectionHeader title="API Keys" subtitle="Manage your API credentials" />
            <div style={{ padding: 20, borderRadius: 12, background: dark ? '#0f172a' : '#f8fafc', border: dark ? '1px solid #334155' : '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: dark ? '#f8fafc' : '#0f172a', margin: '0 0 2px' }}>Production API Key</p>
                  <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: 0 }}>Created Jun 12, 2026 · Last used 2 hours ago</p>
                </div>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: '#dcfce7', color: '#16a34a', fontWeight: 600 }}>Active</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <code style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: dark ? '#1e293b' : '#e2e8f0', fontSize: 13, color: dark ? '#94a3b8' : '#475569', fontFamily: 'monospace' }}>
                  {apiVisible ? 'sk_live_Xmk9pQ2v8rL4nYw3jZ5cA7bT6eH1sF0' : 'sk_live_••••••••••••••••••••••••••••••••'}
                </code>
                <button onClick={() => setApiVisible(!apiVisible)} style={{ padding: '8px 12px', borderRadius: 8, border: dark ? '1px solid #334155' : '1px solid #e2e8f0', background: 'transparent', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', color: dark ? '#94a3b8' : '#64748b' }}>
                  {apiVisible ? 'Hide' : 'Show'}
                </button>
                <button style={{ padding: '8px 12px', borderRadius: 8, border: dark ? '1px solid #334155' : '1px solid #e2e8f0', background: 'transparent', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', color: '#2563eb', fontWeight: 600 }}>Copy</button>
              </div>
            </div>
            <Btn variant="outline" style={{ marginBottom: 24 }}>+ Generate New Key</Btn>

            <SectionHeader title="Webhook Configuration" subtitle="Receive real-time event notifications" />
            <Input label="Webhook Endpoint URL" defaultValue="https://your-server.com/webhooks/marketmind" />
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: dark ? '#94a3b8' : '#475569', marginBottom: 8 }}>Events to Subscribe</label>
              {['sale.completed', 'anomaly.detected', 'forecast.updated', 'inventory.low', 'invoice.paid'].map(e => (
                <label key={e} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked={e !== 'invoice.paid'} style={{ width: 14, height: 14, cursor: 'pointer' }} />
                  <code style={{ fontSize: 13, color: dark ? '#94a3b8' : '#475569', fontFamily: 'monospace' }}>{e}</code>
                </label>
              ))}
            </div>
          </div>
        )

      case 'Security':
        return (
          <div>
            <SectionHeader title="Authentication" subtitle="Password and two-factor settings" />
            <SettingRow label="Two-Factor Authentication" desc="Add an extra layer of security to your account"><Toggle checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} /></SettingRow>
            {twoFactor && (
              <div style={{ padding: 16, borderRadius: 10, background: '#f0fdf4', border: '1px solid #22c55e30', marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, margin: '0 0 4px' }}>✓ 2FA is enabled</p>
                <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>Authenticator app connected. Backup codes generated.</p>
              </div>
            )}
            <SettingRow label="Session Timeout" desc="Automatically sign out after inactivity">
              <select style={{ padding: '6px 10px', borderRadius: 8, border: dark ? '1px solid #334155' : '1px solid #e2e8f0', background: dark ? '#0f172a' : '#f8fafc', color: dark ? '#f8fafc' : '#334155', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none' }}>
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
                <option>Never</option>
              </select>
            </SettingRow>

            <div style={{ height: 20 }} />
            <SectionHeader title="Change Password" />
            <Input label="Current Password" defaultValue="" type="password" />
            <Input label="New Password" defaultValue="" type="password" />
            <Input label="Confirm New Password" defaultValue="" type="password" />

            <div style={{ height: 20 }} />
            <SectionHeader title="Active Sessions" subtitle="Devices logged into your account" />
            {[
              { device: 'MacBook Pro 16"', location: 'San Francisco, CA', time: 'Current session', current: true },
              { device: 'iPhone 15 Pro', location: 'San Francisco, CA', time: '2 hours ago', current: false },
              { device: 'Chrome on Windows', location: 'New York, NY', time: '3 days ago', current: false },
            ].map(s => (
              <div key={s.device} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: dark ? '1px solid #1e293b' : '1px solid #f1f5f9' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: dark ? '#f8fafc' : '#0f172a', margin: 0 }}>{s.device} {s.current && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 99, background: '#dcfce7', color: '#16a34a', fontWeight: 600, marginLeft: 6 }}>Current</span>}</p>
                  <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: '2px 0 0' }}>{s.location} · {s.time}</p>
                </div>
                {!s.current && <button style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid #fee2e2', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Revoke</button>}
              </div>
            ))}
          </div>
        )

      case 'Theme & Appearance':
        return (
          <div>
            <SectionHeader title="Appearance" subtitle="Customize the look of MarketMind AI" />
            <SettingRow label="Dark Mode" desc="Switch between light and dark interface"><Toggle checked={dark} onChange={toggle} /></SettingRow>

            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: dark ? '#94a3b8' : '#475569', marginBottom: 12 }}>Accent Color</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {['#2563eb', '#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#0891b2'].map(c => (
                  <button key={c} title={c} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: c === '#2563eb' ? `3px solid ${dark ? '#f8fafc' : '#0f172a'}` : 'none', cursor: 'pointer', outline: 'none' }} />
                ))}
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: dark ? '#94a3b8' : '#475569', marginBottom: 12 }}>Sidebar Style</p>
              <div style={{ display: 'flex', gap: 12 }}>
                {['Compact', 'Default', 'Expanded'].map(s => (
                  <button key={s} style={{ padding: '8px 20px', borderRadius: 10, border: s === 'Default' ? '2px solid #2563eb' : (dark ? '1px solid #334155' : '1px solid #e2e8f0'), background: s === 'Default' ? '#eff6ff' : 'transparent', color: s === 'Default' ? '#2563eb' : (dark ? '#94a3b8' : '#475569'), fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{s}</button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: dark ? '#94a3b8' : '#475569', marginBottom: 12 }}>Data Density</p>
              <div style={{ display: 'flex', gap: 12 }}>
                {['Comfortable', 'Compact', 'Dense'].map(s => (
                  <button key={s} style={{ padding: '8px 20px', borderRadius: 10, border: s === 'Comfortable' ? '2px solid #2563eb' : (dark ? '1px solid #334155' : '1px solid #e2e8f0'), background: s === 'Comfortable' ? '#eff6ff' : 'transparent', color: s === 'Comfortable' ? '#2563eb' : (dark ? '#94a3b8' : '#475569'), fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'Integrations':
        return (
          <div>
            <SectionHeader title="Connected Integrations" subtitle="Sync MarketMind AI with your existing tools" />
            {[
              { name: 'Shopify', desc: 'E-commerce platform · Auto-sync orders and products', connected: true, icon: '🛍️' },
              { name: 'QuickBooks', desc: 'Accounting software · Sync invoices and financials', connected: true, icon: '📒' },
              { name: 'Mailchimp', desc: 'Email marketing · Trigger campaigns from segments', connected: false, icon: '📧' },
              { name: 'Salesforce', desc: 'CRM · Bi-directional customer data sync', connected: false, icon: '☁️' },
              { name: 'Slack', desc: 'Team messaging · Send alerts and reports', connected: false, icon: '💬' },
              { name: 'Google Analytics', desc: 'Web analytics · Combine with sales data', connected: true, icon: '📊' },
            ].map(i => (
              <div key={i.name} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: dark ? '1px solid #1e293b' : '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{i.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: dark ? '#f8fafc' : '#0f172a', margin: 0 }}>{i.name}</p>
                  <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: '2px 0 0' }}>{i.desc}</p>
                </div>
                <button style={{ padding: '7px 16px', borderRadius: 8, border: i.connected ? '1px solid #fee2e2' : '1px solid #e2e8f0', background: i.connected ? '#fef2f2' : '#eff6ff', color: i.connected ? '#ef4444' : '#2563eb', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                  {i.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your account, notifications, API keys, and preferences"
        actions={
          <Btn onClick={handleSave} style={{ background: saved ? '#22c55e' : '#2563eb' }}>
            {saved ? '✓ Saved!' : 'Save Changes'}
          </Btn>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        {/* Sidebar nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {settingsSections.map(s => (
            <button key={s} onClick={() => setActiveSection(s)} style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 10, border: 'none', background: activeSection === s ? (dark ? 'rgba(37,99,235,0.15)' : '#eff6ff') : 'transparent', color: activeSection === s ? '#2563eb' : (dark ? '#94a3b8' : '#475569'), fontSize: 14, fontWeight: activeSection === s ? 600 : 400, cursor: 'pointer', fontFamily: 'Inter, sans-serif', borderLeft: activeSection === s ? '3px solid #2563eb' : '3px solid transparent' }}>
              {s}
            </button>
          ))}
        </div>

        {/* Content */}
        <Card style={{ padding: 28 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: dark ? '#f8fafc' : '#0f172a', margin: '0 0 4px' }}>{activeSection}</h3>
          <p style={{ fontSize: 13, color: dark ? '#64748b' : '#94a3b8', margin: '0 0 24px' }}>
            {activeSection === 'Profile' ? 'Update your personal information and business details' :
             activeSection === 'Notifications' ? 'Choose what you want to be notified about' :
             activeSection === 'API Configuration' ? 'Manage API keys and webhook endpoints' :
             activeSection === 'Security' ? 'Keep your account safe and secure' :
             activeSection === 'Theme & Appearance' ? 'Customize the look and feel of your dashboard' :
             'Connect with third-party tools and services'}
          </p>
          {renderContent()}
        </Card>
      </div>
    </div>
  )
}
