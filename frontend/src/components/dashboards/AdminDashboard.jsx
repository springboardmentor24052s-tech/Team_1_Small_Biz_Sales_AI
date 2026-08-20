import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, Cpu, Database, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../ui/Badge';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/Card';

export const AdminDashboard = () => {
  const { api, profile } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('rbac');
  const [roles, setRoles] = useState([]);
  const [logs, setLogs] = useState([]);

  const loadPlatformData = useCallback(async () => {
    try {
      const [roleCatalog, auditEvents] = await Promise.all([
        api('/users/roles/catalog'),
        api('/audit?limit=100')
      ]);
      setRoles(roleCatalog);
      setLogs(auditEvents);
    } catch (error) {
      addToast(error.message, 'error');
    }
  }, [api, addToast]);

  useEffect(() => {
    loadPlatformData();
    const seconds = Number(profile?.role_preferences?.monitoring_refresh || 60);
    const timer = window.setInterval(loadPlatformData, seconds * 1000);
    return () => window.clearInterval(timer);
  }, [loadPlatformData, profile?.role_preferences?.monitoring_refresh]);

  const permissions = useMemo(
    () => [...new Set(roles.flatMap((role) => role.permissions))].sort(),
    [roles]
  );
  const roleByCode = Object.fromEntries(roles.map((role) => [role.code, role]));

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950 via-purple-900 to-slate-900 border border-purple-800/80 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-purple-200 mb-2"><ShieldCheck className="w-4 h-4" /> Internal MarketMind Access</div>
        <h2 className="text-2xl font-bold">Platform Administration</h2>
        <p className="text-sm text-purple-200 mt-1">Monitor platform security, RBAC policy, datasets, models and audit activity. Business employee accounts are managed by each Business Owner.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><Activity className="w-5 h-5 text-emerald-500" /><p className="text-xs text-slate-500 mt-3">API Status</p><p className="text-lg font-bold">Connected</p><p className="mt-1 text-xs text-slate-400">Refreshes every {profile?.role_preferences?.monitoring_refresh || 60} seconds</p></Card>
        <Card><Cpu className="w-5 h-5 text-purple-500" /><p className="text-xs text-slate-500 mt-3">Forecast Engine</p><p className="text-lg font-bold">Monitoring enabled</p></Card>
        <Card><Database className="w-5 h-5 text-blue-500" /><p className="text-xs text-slate-500 mt-3">Platform Events</p><p className="text-lg font-bold">{logs.length} recent</p></Card>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button onClick={() => setActiveTab('rbac')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'rbac' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}>RBAC Policy</button>
        <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'logs' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}>Security Audit</button>
      </div>

      {activeTab === 'rbac' && (
        <Card>
          <CardHeader><div><CardTitle>Platform Permission Matrix</CardTitle><CardDescription>System policy is visible here; employee assignment is owned by the Business Owner.</CardDescription></div><Badge variant="info">Read only</Badge></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800"><tr><th className="p-3">Permission</th><th className="p-3 text-center">Owner</th><th className="p-3 text-center">Manager</th><th className="p-3 text-center">Sales</th><th className="p-3 text-center">Admin</th></tr></thead>
              <tbody>{permissions.map((permission) => <tr key={permission} className="border-b border-slate-100 dark:border-slate-800/70"><td className="p-3 font-mono font-semibold">{permission}</td>{['business_owner', 'store_manager', 'sales_executive', 'administrator'].map((role) => <td key={role} className="p-3 text-center">{roleByCode[role]?.permissions.includes(permission) ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-700 mx-auto" />}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'logs' && (
        <Card>
          <CardHeader><div><CardTitle>Security Audit Trail</CardTitle><CardDescription>Authentication, access and privileged platform events.</CardDescription></div></CardHeader>
          <div className="space-y-3">{logs.map((event) => <div key={event.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:justify-between gap-2 text-xs"><div><p className="font-bold">{event.event_type}</p><p className="text-slate-500 mt-1">{Object.entries(event.details || {}).map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`).join(' · ') || 'No additional details'}</p></div><span className="text-slate-400 shrink-0">{new Date(event.created_at).toLocaleString()}</span></div>)}</div>
        </Card>
      )}
    </div>
  );
};
