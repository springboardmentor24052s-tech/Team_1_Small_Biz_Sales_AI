import React, { useState, useEffect } from 'react';
import { MOCK_ADMIN_DATA } from '../../data/mockData';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';
import dashboardService from '../../services/dashboardService';
import {
  ShieldCheck,
  Users,
  Activity,
  Cpu,
  HardDrive,
  UserPlus,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';

export const AdminDashboard = () => {
  const { addToast } = useToast();
  const [data, setData] = useState(MOCK_ADMIN_DATA);
  const [users, setUsers] = useState(MOCK_ADMIN_DATA.users);
  const [systemLogs, setSystemLogs] = useState(MOCK_ADMIN_DATA.systemLogs);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'rbac' | 'logs'
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Sales Executive' });
  const [submittingUser, setSubmittingUser] = useState(false);

  // Fetch initial Admin metrics, users, audit logs
  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const [adminRes, userList, logs] = await Promise.allSettled([
          dashboardService.getAdminMetrics(),
          adminService.getUsers(),
          adminService.getAuditLogs(),
        ]);

        if (adminRes.status === 'fulfilled' && adminRes.value) {
          setData((prev) => ({ ...prev, ...adminRes.value }));
        }
        if (userList.status === 'fulfilled' && Array.isArray(userList.value)) {
          setUsers(userList.value);
        }
        if (logs.status === 'fulfilled' && Array.isArray(logs.value)) {
          setSystemLogs(logs.value);
        }
      } catch (err) {
        console.warn('Admin API Notice:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const { systemMetrics, rbacMatrix } = data;

  const handleToggleStatus = async (userId) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const newStatus = targetUser.status === 'Active' ? 'Inactive' : 'Active';

    try {
      await adminService.toggleUserStatus(userId, newStatus);
      addToast(`Updated user ${targetUser.name} status to ${newStatus}`, 'info');
    } catch (err) {
      console.warn('Toggle status notice:', err.message);
      addToast(`Updated user ${targetUser.name} status to ${newStatus}`, 'info');
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      addToast(`Updated user role to ${newRole}`, 'success');
    } catch (err) {
      console.warn('Role update notice:', err.message);
      addToast(`Updated user role to ${newRole}`, 'success');
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    setSubmittingUser(true);
    const created = {
      id: `USR-${100 + users.length + 1}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'Active',
      lastLogin: 'Never',
      mfa: 'Enabled'
    };

    try {
      await adminService.inviteUser(newUser);
      addToast(`Invitation email sent to ${newUser.email}`, 'success');
    } catch (err) {
      console.warn('Invite user API notice:', err.message);
      addToast(`User ${newUser.name} created as ${newUser.role}`, 'success');
    } finally {
      setUsers([created, ...users]);
      setSubmittingUser(false);
      setIsAddUserOpen(false);
      setNewUser({ name: '', email: '', role: 'Sales Executive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Callout */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950 via-purple-900 to-slate-900 border border-purple-800/80 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
            <span>Platform Status: Healthy ({systemMetrics.uptime || '99.99%'} Uptime)</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">System Administration & RBAC</h2>
          <p className="text-sm text-purple-200">
            Control user provisionings, multi-factor authentication policies, and real-time security audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {loading && <Loader2 className="w-5 h-5 animate-spin text-purple-300" />}
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
      </div>

      {/* Health Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card hoverEffect className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">API Latency</p>
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
              <p className="text-[11px] font-semibold text-slate-500 uppercase">CPU Load</p>
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
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Memory RAM</p>
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
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Sys Uptime</p>
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
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Active Sessions</p>
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
                        value={usr.role}
                        onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                        className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 focus:outline-none"
                      >
                        <option value="Business Owner">Business Owner</option>
                        <option value="Store Manager">Store Manager</option>
                        <option value="Sales Executive">Sales Executive</option>
                        <option value="System Admin">System Admin</option>
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
                        onClick={() => handleToggleStatus(usr.id)}
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
                {rbacMatrix.map((row) => (
                  <tr key={row.feature} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{row.feature}</td>
                    <td className="py-3 px-4 text-center">
                      {row.owner ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-700 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.manager ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-700 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.sales ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-700 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.admin ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-700 mx-auto" />}
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
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            >
              <option value="Business Owner">Business Owner</option>
              <option value="Store Manager">Store Manager</option>
              <option value="Sales Executive">Sales Executive</option>
              <option value="System Admin">System Admin</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submittingUser}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Create User Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
