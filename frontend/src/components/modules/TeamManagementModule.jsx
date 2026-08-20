import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CalendarDays, Copy, Crown, IndianRupee, Search, ShieldCheck, Target, TrendingUp, UserCheck, UserPlus, Users } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { ProfileAvatar } from '../common/ProfileAvatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

const EMPLOYEE_ROLES = new Set(['store_manager', 'sales_executive']);
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const levelLabel = { excellent: 'Excellent', on_track: 'On track', needs_attention: 'Needs attention', not_rated: 'Not rated' };
const levelVariant = { excellent: 'success', on_track: 'info', needs_attention: 'warning', not_rated: 'default' };

export const TeamManagementModule = () => {
  const { api, reauthenticate, currentRole } = useAuth();
  const { users, refresh } = useData();
  const { addToast } = useToast();
  const isOwner = currentRole.id === 'owner';
  const [overview, setOverview] = useState(null);
  const [roles, setRoles] = useState([]);
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({ search: '', role: 'all', store: 'all', from: '', to: '' });
  const [selected, setSelected] = useState(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [invitationToken, setInvitationToken] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState({ fullName: '', email: '', confirmEmail: '', roleCode: 'sales_executive', storeId: '' });
  const [assignments, setAssignments] = useState({});
  const [targetEmployee, setTargetEmployee] = useState(null);
  const [target, setTarget] = useState({ targetValue: '', periodStart: '', periodEnd: '' });

  const performanceQuery = useMemo(() => (!filters.from || !filters.to ? '' : `?date_from=${filters.from}&date_to=${filters.to}`), [filters.from, filters.to]);
  const loadPerformance = useCallback(async () => {
    setLoading(true);
    try { setOverview(await api(`/team/overview${performanceQuery}`)); }
    catch (error) { addToast(error.message, 'error'); }
    finally { setLoading(false); }
  }, [api, addToast, performanceQuery]);
  const loadCatalogs = useCallback(async () => {
    if (!isOwner) return;
    try {
      const [roleCatalog, storeCatalog] = await Promise.all([api('/users/roles/catalog'), api('/users/stores/catalog')]);
      setRoles(roleCatalog.filter((role) => EMPLOYEE_ROLES.has(role.code)));
      setStores(storeCatalog);
    } catch (error) { addToast(error.message, 'error'); }
  }, [api, addToast, isOwner]);

  useEffect(() => { loadPerformance(); }, [loadPerformance]);
  useEffect(() => { loadCatalogs(); }, [loadCatalogs]);
  useEffect(() => setAssignments(Object.fromEntries(users.filter((user) => EMPLOYEE_ROLES.has(user.role.code)).map((user) => [user.id, { roleCode: user.role.code, storeId: user.store_id || '' }]))), [users]);

  const employees = useMemo(() => (overview?.employees || []).filter((employee) => {
    const text = `${employee.full_name} ${employee.email}`.toLowerCase();
    return text.includes(filters.search.toLowerCase()) && (filters.role === 'all' || employee.role_code === filters.role) && (filters.store === 'all' || employee.store_id === filters.store);
  }), [overview, filters]);

  const requestConfirmation = (description, run) => { setPassword(''); setPendingAction({ description, run }); };
  const confirmAction = async (event) => {
    event.preventDefault();
    if (!pendingAction) return;
    setSaving(true);
    try {
      const result = await reauthenticate({ password });
      await pendingAction.run(result.reauth_token);
      setPendingAction(null);
      await Promise.all([refresh(), loadPerformance()]);
    } catch (error) { addToast(error.message, 'error'); } finally { setSaving(false); }
  };
  const submitInvite = (event) => {
    event.preventDefault();
    if (invite.email.trim().toLowerCase() !== invite.confirmEmail.trim().toLowerCase()) {
      addToast('Email addresses do not match. Please check for typing mistakes.', 'error');
      return;
    }
    requestConfirmation(`Invite ${invite.fullName.trim()} to your business`, async (reauthToken) => {
      const result = await api('/users/invite', { method: 'POST', headers: { 'X-Reauth-Token': reauthToken }, body: JSON.stringify({ full_name: invite.fullName.trim(), email: invite.email.trim().toLowerCase(), role_code: invite.roleCode, store_id: invite.storeId }) });
      setInvitationToken(result.token || ''); setIsInviteOpen(false);
      setInvite({ fullName: '', email: '', confirmEmail: '', roleCode: 'sales_executive', storeId: '' });
      addToast(result.message, 'success');
    });
  };
  const saveAssignment = (employee) => {
    const assignment = assignments[employee.employee_id];
    if (!assignment?.storeId) return addToast('Select a store before saving', 'error');
    requestConfirmation(`Update ${employee.full_name}'s role and store`, async (reauthToken) => {
      await api(`/users/${employee.employee_id}/role`, { method: 'PATCH', headers: { 'X-Reauth-Token': reauthToken }, body: JSON.stringify({ role_code: assignment.roleCode, store_id: assignment.storeId }) });
      addToast('Employee assignment updated', 'success');
    });
  };
  const toggleEmployee = (employee) => {
    const enabled = employee.status !== 'active';
    requestConfirmation(`${enabled ? 'Enable' : 'Disable'} ${employee.full_name}'s account`, async (reauthToken) => {
      await api(`/users/${employee.employee_id}/state`, { method: 'PATCH', headers: { 'X-Reauth-Token': reauthToken }, body: JSON.stringify({ enabled }) });
      addToast(`Employee account ${enabled ? 'enabled' : 'disabled'}`, 'success');
    });
  };
  const openTarget = (employee) => {
    setTargetEmployee(employee);
    setTarget({ targetValue: employee.target?.target_value || '', periodStart: employee.target?.period_start || employee.period_start, periodEnd: employee.target?.period_end || employee.period_end });
  };
  const submitTarget = (event) => {
    event.preventDefault();
    requestConfirmation(`Set a revenue target for ${targetEmployee.full_name}`, async (reauthToken) => {
      await api(`/team/employees/${targetEmployee.employee_id}/targets`, { method: 'POST', headers: { 'X-Reauth-Token': reauthToken }, body: JSON.stringify({ target_value: target.targetValue, period_start: target.periodStart, period_end: target.periodEnd, metric: 'revenue' }) });
      setTargetEmployee(null); setSelected(null); addToast('Revenue target saved', 'success');
    });
  };

  const title = isOwner ? 'Team Performance & Access' : currentRole.id === 'manager' ? 'Store Team Performance' : 'My Performance';
  const description = isOwner ? 'Manage employee access, set targets and understand individual performance.' : currentRole.id === 'manager' ? 'Review Sales Executives assigned to your store.' : 'Track your authorized sales, target progress and improvement areas.';

  return <div className="space-y-6">
    <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-violet-800 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4"><div><div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-200 mb-2"><ShieldCheck className="w-4 h-4" /> {isOwner ? 'Business Owner Control' : 'Role-scoped analytics'}</div><h2 className="text-2xl font-bold">{title}</h2><p className="text-sm text-indigo-200 mt-1">{description}</p></div>{isOwner && <Button icon={UserPlus} onClick={() => setIsInviteOpen(true)}>Invite Employee</Button>}</div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4"><Stat icon={Users} label={currentRole.id === 'sales' ? 'Your Account' : 'Team Members'} value={overview?.total_employees || 0} color="indigo" /><Stat icon={UserCheck} label="Active" value={overview?.active_employees || 0} color="emerald" /><Stat icon={AlertTriangle} label="Below Target" value={overview?.below_target || 0} color="amber" /><Stat icon={Crown} label="Top Performer" value={overview?.top_performer?.full_name || 'Not available'} color="violet" small /><Stat icon={TrendingUp} label="Top Revenue" value={overview?.top_performer ? money(overview.top_performer.metrics.revenue) : '—'} color="blue" small /></div>
    <Card hoverEffect={false}><CardHeader><div><CardTitle>Performance period</CardTitle><CardDescription>Leave dates empty to use the latest 30 days available in the database.</CardDescription></div><CalendarDays className="w-5 h-5 text-indigo-500" /></CardHeader><div className="grid md:grid-cols-6 gap-3"><div className="relative md:col-span-2"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input aria-label="Search employees" placeholder="Search name or email" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" /></div>{currentRole.id !== 'sales' && <select aria-label="Filter by role" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3"><option value="all">All roles</option><option value="store_manager">Store Managers</option><option value="sales_executive">Sales Executives</option></select>}{isOwner && <select aria-label="Filter by store" value={filters.store} onChange={(e) => setFilters({ ...filters, store: e.target.value })} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3"><option value="all">All stores</option>{stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select>}<input aria-label="Performance start date" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3" /><input aria-label="Performance end date" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3" /><Button onClick={loadPerformance} isLoading={loading}>Apply</Button></div></Card>
    <Card hoverEffect={false}><CardHeader><div><CardTitle>{currentRole.id === 'sales' ? 'Personal performance' : 'Employee directory'}</CardTitle><CardDescription>All figures come from completed database transactions in the selected period.</CardDescription></div><Badge variant="info">Real records</Badge></CardHeader>{employees.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800"><tr><th className="p-3">Employee</th><th className="p-3">Revenue</th><th className="p-3">Target</th><th className="p-3">Orders</th><th className="p-3">Performance</th><th className="p-3 text-right">Action</th></tr></thead><tbody>{employees.map((employee) => <EmployeeRow key={employee.employee_id} employee={employee} onSelect={() => setSelected(employee)} />)}</tbody></table></div> : <div className="py-12 text-center text-slate-500"><Users className="w-8 h-8 mx-auto mb-3" /><p>{loading ? 'Loading performance…' : 'No employees match these filters.'}</p></div>}</Card>
    <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? `${selected.full_name} · Performance analysis` : ''} maxWidth="max-w-4xl">{selected && <PerformanceDetail employee={selected} isOwner={isOwner} onSetTarget={() => openTarget(selected)} onSaveAssignment={() => saveAssignment(selected)} onToggle={() => toggleEmployee(selected)} roles={roles} stores={stores} assignment={assignments[selected.employee_id]} setAssignment={(value) => setAssignments((current) => ({ ...current, [selected.employee_id]: value }))} />}</Modal>
    <Modal isOpen={Boolean(targetEmployee)} onClose={() => setTargetEmployee(null)} title="Set revenue target"><form onSubmit={submitTarget} className="space-y-4"><p className="text-sm text-slate-500">Assign a measurable target to {targetEmployee?.full_name}. Achievement uses completed sales.</p><Input label="Revenue Target (₹)" type="number" min="1" step="0.01" value={target.targetValue} onChange={(e) => setTarget({ ...target, targetValue: e.target.value })} required /><Input label="Period Start" type="date" value={target.periodStart} onChange={(e) => setTarget({ ...target, periodStart: e.target.value })} required /><Input label="Period End" type="date" value={target.periodEnd} onChange={(e) => setTarget({ ...target, periodEnd: e.target.value })} required /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setTargetEmployee(null)}>Cancel</Button><Button type="submit" icon={Target}>Continue</Button></div></form></Modal>
    <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Employee"><form onSubmit={submitInvite} className="space-y-4"><div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200">The employee account stays pending until the invitation is opened and a password is created. This confirms ownership of the work email.</div><Input label="Full Name" value={invite.fullName} onChange={(e) => setInvite({ ...invite, fullName: e.target.value })} required /><Input label="Work Email" type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} required /><Input label="Confirm Work Email" type="email" value={invite.confirmEmail} onChange={(e) => setInvite({ ...invite, confirmEmail: e.target.value })} required /><Select label="Role" value={invite.roleCode} onChange={(value) => setInvite({ ...invite, roleCode: value })} options={roles.map((role) => [role.code, role.name])} /><Select label="Store" value={invite.storeId} onChange={(value) => setInvite({ ...invite, storeId: value })} options={stores.map((store) => [store.id, store.name])} placeholder="Select store" /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setIsInviteOpen(false)}>Cancel</Button><Button type="submit" icon={UserCheck}>Send Invitation</Button></div></form></Modal>
    <Modal isOpen={Boolean(pendingAction)} onClose={() => !saving && setPendingAction(null)} title="Confirm Business Change"><form onSubmit={confirmAction} className="space-y-4"><p className="text-sm text-slate-600 dark:text-slate-300">{pendingAction?.description}. Confirm with your password.</p><Input label="Business Owner Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setPendingAction(null)}>Cancel</Button><Button type="submit" isLoading={saving}>Confirm</Button></div></form></Modal>
    <Modal isOpen={Boolean(invitationToken)} onClose={() => setInvitationToken('')} title="Development Invitation Token"><div className="space-y-4"><p className="text-sm text-slate-500">Email delivery is not configured locally, so use this one-time token for testing. Production sends it to the employee's mailbox.</p><div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 break-all font-mono text-xs">{invitationToken}</div><div className="flex justify-end"><Button icon={Copy} onClick={() => { navigator.clipboard.writeText(invitationToken); addToast('Invitation token copied', 'success'); }}>Copy Token</Button></div></div></Modal>
  </div>;
};

const EmployeeRow = ({ employee, onSelect }) => <tr className="border-b border-slate-100 dark:border-slate-800/70 hover:bg-slate-50/70 dark:hover:bg-slate-800/30"><td className="p-3"><div className="flex items-center gap-3"><ProfileAvatar profile={{ avatar_url: employee.avatar_url, avatar_emoji: employee.avatar_emoji }} className="w-10 h-10 rounded-xl text-lg" /><div><p className="font-semibold">{employee.full_name}</p><p className="text-xs text-slate-500">{employee.role_name} · {employee.store_name || 'No store'}</p></div></div></td><td className="p-3 font-semibold">{money(employee.metrics.revenue)}<p className={`text-xs ${(employee.metrics.revenue_change_percentage || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{employee.metrics.revenue_change_percentage == null ? 'No comparison' : `${employee.metrics.revenue_change_percentage > 0 ? '+' : ''}${employee.metrics.revenue_change_percentage}%`}</p></td><td className="p-3">{employee.target ? <div className="min-w-28"><div className="flex justify-between text-xs"><span>{employee.target.completion_percentage}%</span><span>{money(employee.target.target_value)}</span></div><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-1"><div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${Math.min(employee.target.completion_percentage, 100)}%` }} /></div></div> : <span className="text-slate-400">Not assigned</span>}</td><td className="p-3">{employee.metrics.transactions}</td><td className="p-3"><Badge variant={levelVariant[employee.performance_level]}>{levelLabel[employee.performance_level]}</Badge>{employee.store_rank && <p className="text-xs text-slate-500 mt-1">Store rank #{employee.store_rank}</p>}</td><td className="p-3 text-right"><Button size="sm" variant="outline" onClick={onSelect}>Analyse</Button></td></tr>;
const statColor = { indigo: 'text-indigo-500', emerald: 'text-emerald-500', amber: 'text-amber-500', violet: 'text-violet-500', blue: 'text-blue-500' };
const Stat = ({ icon: Icon, label, value, color, small }) => <Card><Icon className={`w-5 h-5 ${statColor[color]} mb-3`} /><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className={`${small ? 'text-base' : 'text-2xl'} font-bold mt-1 truncate`}>{value}</p></Card>;
const Metric = ({ icon: Icon, label, value }) => <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3"><Icon className="w-4 h-4 text-indigo-500 mb-2" /><p className="text-xs text-slate-500">{label}</p><p className="font-bold mt-1">{value}</p></div>;
const Select = ({ label, value, onChange, options, placeholder }) => <div><label className="block text-xs font-semibold mb-1.5">{label}</label><select required className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent p-2.5" value={value} onChange={(e) => onChange(e.target.value)}>{placeholder && <option value="">{placeholder}</option>}{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></div>;

const PerformanceDetail = ({ employee, isOwner, onSetTarget, onSaveAssignment, onToggle, roles, stores, assignment, setAssignment }) => <div className="space-y-5">
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3"><Metric icon={IndianRupee} label="Revenue" value={money(employee.metrics.revenue)} /><Metric icon={BarChart3} label="Transactions" value={employee.metrics.transactions} /><Metric icon={TrendingUp} label="Average Order" value={money(employee.metrics.average_order_value)} /><Metric icon={Users} label="Customers" value={employee.metrics.customers_handled} /></div>
  {employee.target && <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 p-4"><div className="flex justify-between font-semibold"><span>Target progress</span><span>{employee.target.completion_percentage}%</span></div><div className="h-3 bg-white dark:bg-slate-800 rounded-full mt-3"><div className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${Math.min(employee.target.completion_percentage, 100)}%` }} /></div><div className="grid grid-cols-3 gap-2 mt-3 text-xs text-slate-500"><span>Target {money(employee.target.target_value)}</span><span>Remaining {money(employee.target.remaining_value)}</span><span>{employee.target.remaining_days} days left</span></div></div>}
  <div className="grid lg:grid-cols-5 gap-4"><div className="lg:col-span-3 h-60 rounded-2xl border border-slate-200 dark:border-slate-800 p-3"><p className="font-semibold mb-2">Revenue trend</p>{employee.trend.length ? <ResponsiveContainer width="100%" height="88%"><AreaChart data={employee.trend}><CartesianGrid strokeDasharray="3 3" opacity={0.15}/><XAxis dataKey="date" tick={{ fontSize: 10 }}/><YAxis tick={{ fontSize: 10 }}/><Tooltip formatter={(value) => money(value)} /><Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f155" /></AreaChart></ResponsiveContainer> : <div className="h-44 grid place-items-center text-sm text-slate-400">No sales trend available</div>}</div><div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-4"><p className="font-semibold mb-3">Where attention is needed</p><div className="space-y-3">{employee.insights.map((insight) => <div key={insight} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300"><AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /><span>{insight}</span></div>)}</div></div></div>
  <div className="grid sm:grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3"><span className="text-slate-500">Previous-period revenue</span><p className="font-semibold mt-1">{money(employee.metrics.previous_revenue)}</p></div><div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3"><span className="text-slate-500">Last login</span><p className="font-semibold mt-1">{employee.last_login_at ? new Date(employee.last_login_at).toLocaleString('en-IN') : 'Never logged in'}</p></div></div>
  {isOwner && <div className="border-t border-slate-200 dark:border-slate-800 pt-4"><p className="font-semibold mb-3">Access and assignment</p><div className="grid sm:grid-cols-2 gap-3"><Select label="Role" value={assignment?.roleCode || employee.role_code} onChange={(roleCode) => setAssignment({ ...assignment, roleCode })} options={roles.map((role) => [role.code, role.name])} /><Select label="Store" value={assignment?.storeId || employee.store_id || ''} onChange={(storeId) => setAssignment({ ...assignment, storeId })} options={stores.map((store) => [store.id, store.name])} /></div><div className="flex flex-wrap justify-end gap-2 mt-4"><Button variant="secondary" onClick={onSaveAssignment}>Save Assignment</Button><Button variant="outline" icon={Target} onClick={onSetTarget}>Set Target</Button><Button variant={employee.status === 'active' ? 'danger' : 'primary'} onClick={onToggle}>{employee.status === 'active' ? 'Disable Access' : 'Enable Access'}</Button></div></div>}
</div>;
