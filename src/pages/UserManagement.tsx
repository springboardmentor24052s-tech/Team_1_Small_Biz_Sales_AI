import { useState } from 'react'
import { users } from '../data/mockData'
import { Card, SectionHeader, Badge, Table, Tr, Td, PageHeader, Btn } from '../components/ui'
import { useTheme } from '../components/Layout'

const roles = ['Business Owner', 'Administrator', 'Store Manager', 'Sales Executive']

const rolePermissions: Record<string, { label: string; color: string; permissions: string[] }> = {
  'Business Owner': {
    label: 'Business Owner',
    color: '#4f46e5',
    permissions: ['Full platform access', 'Billing & subscriptions', 'User management', 'All reports & exports', 'API key management', 'Settings & integrations'],
  },
  'Administrator': {
    label: 'Administrator',
    color: '#2563eb',
    permissions: ['Full platform access', 'User management', 'All reports & exports', 'API key management', 'Settings & integrations'],
  },
  'Store Manager': {
    label: 'Store Manager',
    color: '#22c55e',
    permissions: ['Inventory management', 'Sales reports', 'Customer data (read)', 'Product management', 'Invoice view'],
  },
  'Sales Executive': {
    label: 'Sales Executive',
    color: '#f59e0b',
    permissions: ['Sales dashboard', 'Customer data (own)', 'Basic reports', 'Invoice creation'],
  },
}

export default function UserManagement() {
  const { dark } = useTheme()
  const [selectedRole, setSelectedRole] = useState('Business Owner')
  const [showInvite, setShowInvite] = useState(false)

  const avatarColors = ['#2563eb', '#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Role-based access control, team members, and permissions"
        actions={<><Btn variant="outline">Export Users</Btn><Btn onClick={() => setShowInvite(true)}>+ Invite User</Btn></>}
      />

      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 440, borderRadius: 16, padding: 28, background: dark ? '#1e293b' : '#fff', border: dark ? '1px solid #334155' : '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: dark ? '#f8fafc' : '#0f172a' }}>Invite Team Member</h3>
              <button onClick={() => setShowInvite(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: dark ? '#64748b' : '#94a3b8' }}>×</button>
            </div>
            {[['Full Name', 'text', 'Sarah Mitchell'], ['Email Address', 'email', 'sarah@company.com']].map(([l, t, p]) => (
              <div key={l} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: dark ? '#94a3b8' : '#475569', marginBottom: 6 }}>{l}</label>
                <input type={t} placeholder={p} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: dark ? '1px solid #334155' : '1px solid #e2e8f0', background: dark ? '#0f172a' : '#f8fafc', color: dark ? '#f8fafc' : '#0f172a', fontSize: 14, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: dark ? '#94a3b8' : '#475569', marginBottom: 6 }}>Role</label>
              <select style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: dark ? '1px solid #334155' : '1px solid #e2e8f0', background: dark ? '#0f172a' : '#f8fafc', color: dark ? '#f8fafc' : '#0f172a', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none' }}>
                {roles.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn onClick={() => setShowInvite(false)} style={{ flex: 1, justifyContent: 'center' }}>Send Invitation</Btn>
              <Btn variant="outline" onClick={() => setShowInvite(false)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { l: 'Total Members', v: users.length },
          { l: 'Active Now', v: users.filter(u => u.status === 'active').length },
          { l: 'Pending Invites', v: 2 },
          { l: 'Roles Defined', v: roles.length },
        ].map(k => (
          <Card key={k.l} style={{ padding: 18, textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 700, margin: '0 0 4px', color: dark ? '#f8fafc' : '#0f172a' }}>{k.v}</p>
            <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: 0, fontWeight: 500 }}>{k.l}</p>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        {/* Users Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <div style={{ padding: '20px 20px 0' }}>
              <SectionHeader title="Team Members" subtitle={`${users.length} members`} />
            </div>
            <Table headers={['Member', 'Role', 'Status', 'Last Login', 'Actions']}>
              {users.map((u, i) => (
                <Tr key={u.id}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: avatarColors[i % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{u.avatar}</div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: dark ? '#f8fafc' : '#0f172a' }}>{u.name}</p>
                        <p style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8', margin: 0 }}>{u.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: `${Object.values(rolePermissions).find(r => r.label === u.role)?.color ?? '#64748b'}15`, color: Object.values(rolePermissions).find(r => r.label === u.role)?.color ?? '#64748b' }}>
                      {u.role}
                    </span>
                  </Td>
                  <Td><Badge status={u.status} /></Td>
                  <Td style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8' }}>{u.lastLogin}</Td>
                  <Td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'transparent', color: '#2563eb', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Edit</button>
                      <button style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid #fee2e2', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Remove</button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
            <div style={{ height: 16 }} />
          </Card>
        </div>

        {/* RBAC Panel */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="Role Permissions" subtitle="Click a role to view access" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {roles.map(r => {
              const rp = rolePermissions[r]
              return (
                <button key={r} onClick={() => setSelectedRole(r)} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 10, border: `2px solid ${selectedRole === r ? rp.color : (dark ? '#334155' : '#e2e8f0')}`, background: selectedRole === r ? `${rp.color}10` : 'transparent', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: selectedRole === r ? rp.color : (dark ? '#94a3b8' : '#475569') }}>{r}</span>
                  <span style={{ float: 'right', fontSize: 11, color: dark ? '#64748b' : '#94a3b8' }}>{users.filter(u => u.role === r).length} users</span>
                </button>
              )
            })}
          </div>

          {selectedRole && rolePermissions[selectedRole] && (
            <div style={{ padding: 16, borderRadius: 12, background: dark ? '#0f172a' : '#f8fafc', border: dark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: rolePermissions[selectedRole].color, margin: '0 0 12px' }}>
                {selectedRole} — Permissions
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rolePermissions[selectedRole].permissions.map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: '#16a34a' }}>✓</span>
                    </div>
                    <span style={{ fontSize: 13, color: dark ? '#94a3b8' : '#475569' }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
