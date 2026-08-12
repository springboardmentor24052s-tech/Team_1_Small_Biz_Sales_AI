import React, { useCallback, useEffect, useState } from 'react';
import { MOCK_ADMIN_DATA } from '../../data/mockData';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Users,
  Activity,
  Cpu,
  HardDrive,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy
} from 'lucide-react';

export const AdminDashboard = () => {
  const { addToast } = useToast();
  const { users: liveUsers, refresh } = useData();
  const { api, profile, reauthenticate } = useAuth();
  const {
    systemMetrics: mockSystemMetrics,
    users: initialUsers
  } = MOCK_ADMIN_DATA;
  const systemMetrics = {
    ...mockSystemMetrics,
    activeSessions: liveUsers.length || mockSystemMetrics.activeSessions
  };

  const [users, setUsers] = useState(initialUsers);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'rbac' | 'logs'
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'sales_executive',
    storeId: ''
  });
  const [roles, setRoles] = useState([]);
  const [stores, setStores] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthMfa, setReauthMfa] = useState('');
  const [invitationToken, setInvitationToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!liveUsers.length) return;
    setUsers(
      liveUsers.map((user) => ({
        id: user.id.slice(0, 8).toUpperCase(),
        backendId: user.id,
        storeId: user.store_id,
        roleCode: user.role.code,
        name: user.full_name,
        email: user.email,
        role: user.role.name,
        status: user.status === 'active'
          ? 'Active'
          : user.status.charAt(0).toUpperCase() + user.status.slice(1),
        lastLogin: 'Backend account',
        mfa: user.mfa_enabled ? 'Enabled' : 'Disabled'
      }))
    );
  }, [liveUsers]);

  const loadAdminData = useCallback(async () => {
    try {
      const [roleCatalog, storeCatalog, auditEvents] = await Promise.all([
        api('/users/roles/catalog'),
        api('/users/stores/catalog'),
        api('/audit?limit=100')
      ]);
      setRoles(roleCatalog);
      setStores(storeCatalog);
      setSystemLogs(
        auditEvents.map((event) => {
          const serializedDetails = Object.entries(event.details || {})
            .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
            .join(' · ');
          const lowerType = event.event_type.toLowerCase();
          return {
            id: event.id,
            timestamp: new Date(event.created_at).toLocaleString(),
            user: event.actor_user_id ? event.actor_user_id.slice(0, 8).toUpperCase() : 'System',
            action: event.event_type,
            level: lowerType.includes('failed') || lowerType.includes('locked')
              ? 'DANGER'
              : lowerType.includes('disabled') || lowerType.includes('void')
              ? 'WARNING'
              : 'INFO',
            details: serializedDetails || 'No additional details'
          };
        })
      );
    } catch (error) {
      addToast(error.message, 'error');
    }
  }, [api, addToast]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const askForReauthentication = (description, run) => {
    setReauthPassword('');
    setReauthMfa('');
    setPendingAction({ description, run });
  };

  const closeReauthentication = () => {
    if (isSaving) return;
    setPendingAction(null);
    setReauthPassword('');
    setReauthMfa('');
  };

  const confirmPrivilegedAction = async (e) => {
    e.preventDefault();
    if (!pendingAction) return;
    setIsSaving(true);
    try {
      const result = await reauthenticate({
        password: reauthPassword,
        mfaCode: reauthMfa
      });
      await pendingAction.run(result.reauth_token);
      setPendingAction(null);
      await Promise.all([refresh(), loadAdminData()]);
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = (user) => {
    const enabled = user.status !== 'Active';
    askForReauthentication(
      `${enabled ? 'Activate' : 'Deactivate'} ${user.name}`,
      async (reauthToken) => {
        await api(`/users/${user.backendId}/state`, {
          method: 'PATCH',
          headers: { 'X-Reauth-Token': reauthToken },
          body: JSON.stringify({ enabled })
        });
        addToast(`${user.name} was ${enabled ? 'activated' : 'deactivated'}`, 'success');
      }
    );
  };

  const handleRoleChange = (user, roleCode) => {
    const storeId = ['store_manager', 'sales_executive'].includes(roleCode)
      ? user.storeId || stores[0]?.id
      : null;
    if (['store_manager', 'sales_executive'].includes(roleCode) && !storeId) {
      addToast('Create an active store before assigning this role', 'error');
      return;
    }
    const roleName = roles.find((role) => role.code === roleCode)?.name || roleCode;
    askForReauthentication(
      `Change ${user.name}'s role to ${roleName}`,
      async (reauthToken) => {
        await api(`/users/${user.backendId}/role`, {
          method: 'PATCH',
          headers: { 'X-Reauth-Token': reauthToken },
          body: JSON.stringify({ role_code: roleCode, store_id: storeId })
        });
        addToast(`${user.name}'s role was updated`, 'success');
      }
    );
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    const needsStore = ['store_manager', 'sales_executive'].includes(newUser.role);
    if (!newUser.name.trim() || !newUser.email.trim() || (needsStore && !newUser.storeId)) return;
    const selectedRole = roles.find((role) => role.code === newUser.role);
    askForReauthentication(
      `Invite ${newUser.name.trim()} as ${selectedRole?.name || newUser.role}`,
      async (reauthToken) => {
        const result = await api('/users/invite', {
          method: 'POST',
          headers: { 'X-Reauth-Token': reauthToken },
          body: JSON.stringify({
            full_name: newUser.name.trim(),
            email: newUser.email.trim().toLowerCase(),
            role_code: newUser.role,
            store_id: needsStore ? newUser.storeId : null
          })
        });
        setInvitationToken(result.token || '');
        setIsAddUserOpen(false);
        setNewUser({ name: '', email: '', role: 'sales_executive', storeId: '' });
        addToast(`Invitation created for ${newUser.email.trim()}`, 'success');
      }
    );
  };

  const permissionCodes = [...new Set(roles.flatMap((role) => role.permissions))].sort();
  const roleByCode = Object.fromEntries(roles.map((role) => [role.code, role]));

  return (
    <div className="space-y-6">
      {/* Top Banner Callout */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950 via-purple-900 to-slate-900 border border-purple-800/80 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
            <span>Core API & Forecast Monitoring Connected</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">System Administration & RBAC</h2>
          <p className="text-sm text-purple-200">
            Control user provisionings, multi-factor authentication policies, and real-time security audit trails.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={UserPlus}
          onClick={() => setIsAddUserOpen(true)}
          className="shrink-0 bg-purple-600 hover:bg-purple-700 font-bold"
        >
          Add New User
        </Button>
      </div>

      {/* Health Metrics Bar */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Badge variant="warning">Infrastructure telemetry planned for Milestone 3</Badge>
        <span>Live model versions, metrics and forecast jobs are available under Reports & Forecasts.</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card hoverEffect className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Demo API Latency</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">{systemMetrics.apiLatency}</p>
            </div>
          </div>
        </Card>

        <Card hoverEffect className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Demo CPU Load</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">{systemMetrics.cpuUsage}</p>
            </div>
          </div>
        </Card>

        <Card hoverEffect className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Demo Memory RAM</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">{systemMetrics.memoryUsage}</p>
            </div>
          </div>
        </Card>

        <Card hoverEffect className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Demo Uptime</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">{systemMetrics.uptime}</p>
            </div>
          </div>
        </Card>

        <Card hoverEffect className="p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Tenant Accounts</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">{systemMetrics.activeSessions}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          User Management ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'rbac'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          RBAC Access Matrix
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'logs'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          System Audit Logs ({systemLogs.length})
        </button>
      </div>

      {/* Tab 1: User Management Table */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle>System Accounts & Provisioning</CardTitle>
                <CardDescription>Manage user roles, MFA policies, and access tokens</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setIsAddUserOpen(true)} icon={UserPlus}>
                Add User
              </Button>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">MFA Status</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {users.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-500">{usr.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{usr.name}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{usr.email}</td>
                    <td className="py-3 px-4">
                      <select
                        aria-label={`Role for ${usr.name}`}
                        value={usr.roleCode}
                        onChange={(event) => handleRoleChange(usr, event.target.value)}
                        disabled={usr.backendId === profile?.id}
                        className="max-w-40 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-semibold text-indigo-600 dark:text-indigo-400 disabled:opacity-60"
                      >
                        {roles.map((role) => (
                          <option key={role.code} value={role.code}>{role.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={usr.mfa === 'Enabled' ? 'success' : 'warning'}>{usr.mfa}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={usr.status === 'Active' ? 'success' : 'neutral'}>{usr.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant={usr.status === 'Active' ? 'ghost' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleStatus(usr)}
                        disabled={usr.backendId === profile?.id}
                      >
                        {usr.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: RBAC Matrix */}
      {activeTab === 'rbac' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Role-Based Access Control (RBAC) Matrix</CardTitle>
              <CardDescription>Granular feature permissions assigned to system roles</CardDescription>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Feature Permission</th>
                  <th className="py-3 px-4 text-center">Business Owner</th>
                  <th className="py-3 px-4 text-center">Store Manager</th>
                  <th className="py-3 px-4 text-center">Sales Executive</th>
                  <th className="py-3 px-4 text-center">System Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {permissionCodes.map((permission) => (
                  <tr key={permission} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">{permission}</td>
                    <td className="py-3 px-4 text-center">
                      {roleByCode.business_owner?.permissions.includes(permission) ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-700 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {roleByCode.store_manager?.permissions.includes(permission) ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-700 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {roleByCode.sales_executive?.permissions.includes(permission) ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-700 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {roleByCode.administrator?.permissions.includes(permission) ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-700 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: System Audit Logs */}
      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Security Audit & Activity Feed</CardTitle>
              <CardDescription>Immutable log stream of system operations</CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-3">
            {systemLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400 text-[11px]">{log.timestamp}</span>
                  <Badge
                    variant={
                      log.level === 'DANGER'
                        ? 'danger'
                        : log.level === 'WARNING'
                        ? 'warning'
                        : log.level === 'SUCCESS'
                        ? 'success'
                        : 'info'
                    }
                    size="sm"
                  >
                    {log.level}
                  </Badge>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{log.action}</span>
                    <p className="text-slate-500 text-[11px]">{log.details}</p>
                  </div>
                </div>
                <span className="font-mono text-slate-400 text-[11px] shrink-0">User: {log.user}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Provision New User Account"
      >
        <form onSubmit={handleAddUserSubmit} className="space-y-4">
          <Input
            id="newUserName"
            label="Full Name"
            placeholder="John Doe"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            required
          />

          <Input
            id="newUserEmail"
            label="Work Email"
            type="email"
            placeholder="john@company.com"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Assigned Role
            </label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value, storeId: '' })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            >
              {roles.map((role) => (
                <option key={role.code} value={role.code}>{role.name}</option>
              ))}
            </select>
          </div>

          {['store_manager', 'sales_executive'].includes(newUser.role) && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Assigned Store
              </label>
              <select
                value={newUser.storeId}
                onChange={(e) => setNewUser({ ...newUser, storeId: e.target.value })}
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                <option value="">Select a store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>{store.name} ({store.code})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-purple-600 hover:bg-purple-700">
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(pendingAction)}
        onClose={closeReauthentication}
        title="Confirm Sensitive Change"
      >
        <form onSubmit={confirmPrivilegedAction} className="space-y-4">
          <div className="flex gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{pendingAction?.description}. Enter your credentials to continue.</p>
          </div>
          <Input
            id="reauthPassword"
            label="Admin Password"
            type="password"
            value={reauthPassword}
            onChange={(event) => setReauthPassword(event.target.value)}
            required
          />
          {profile?.mfa_enabled && (
            <Input
              id="reauthMfa"
              label="MFA Code"
              inputMode="numeric"
              value={reauthMfa}
              onChange={(event) => setReauthMfa(event.target.value)}
              required
            />
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeReauthentication}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Confirming...' : 'Confirm Change'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(invitationToken)}
        onClose={() => setInvitationToken('')}
        title="Invitation Ready"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Share this one-time development token securely with the invited teammate.
          </p>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 break-all font-mono text-xs">
            {invitationToken}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              icon={Copy}
              onClick={() => {
                navigator.clipboard.writeText(invitationToken);
                addToast('Invitation token copied', 'success');
              }}
            >
              Copy Token
            </Button>
            <Button type="button" variant="primary" onClick={() => setInvitationToken('')}>Done</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
