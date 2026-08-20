import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, BrainCircuit, CheckCircle2, ChevronRight, ClipboardCheck, Database, Download, FileSpreadsheet, PackageCheck, Plus, Rocket, ShieldCheck, Upload, Users, WandSparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

const importTypes = [
  { id: 'products', title: 'Product Catalog', description: 'SKU, product name and optional category details.', columns: 'sku,name,category,style,size,color', sample: 'SKU-001,Cotton Shirt,Apparel,Casual,M,Blue', icon: PackageCheck },
  { id: 'inventory', title: 'Opening Inventory', description: 'Opening stock and reorder level for catalog SKUs.', columns: 'sku,stock_quantity,reorder_level', sample: 'SKU-001,40,10', icon: Database, store: true },
  { id: 'customers', title: 'Customer Summary', description: 'Import customers before sales so visits and product preferences can be linked.', columns: 'customer_id,last_purchase,order_count,item_quantity,total_revenue,recency_days', sample: 'CUSTOMER-001,2026-08-01,4,7,8200.00,19', icon: Users, seller: true },
  { id: 'sales', title: 'Sales Transactions', description: 'Customer and product-linked orders used by Customer 360 and forecasts.', columns: 'order_id,order_date,customer_id,sku,quantity,amount,currency', sample: 'ORDER-001,2026-08-01,CUSTOMER-001,SKU-001,2,2499.00,INR', icon: FileSpreadsheet, store: true, seller: true }
];

const checklistLabels = {
  business_created: 'Business account created', store_ready: 'At least one store is ready', team_ready: 'Manager and Sales Executive invited', products_ready: 'Product catalog added', inventory_ready: 'Opening inventory added', sales_ready: 'Sales history added', customers_ready: 'Customer summary added'
};

export const BusinessSetupModule = ({ onNavigate }) => {
  const { api, reauthenticate, profile } = useAuth();
  const { users, refresh } = useData();
  const { addToast } = useToast();
  const [status, setStatus] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeModal, setStoreModal] = useState(false);
  const [storeForm, setStoreForm] = useState({ name: '', code: '', timezone: profile?.timezone || 'Asia/Kolkata' });
  const [preview, setPreview] = useState(null);
  const [selectedImport, setSelectedImport] = useState(null);
  const [importScope, setImportScope] = useState({ storeId: profile?.store_id || '', sellerId: '' });
  const [confirmAction, setConfirmAction] = useState(null);
  const [password, setPassword] = useState('');
  const [working, setWorking] = useState(false);
  const fileInput = useRef(null);

  const sellers = useMemo(() => users.filter((user) => user.role.code === 'sales_executive' && user.status === 'active'), [users]);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextStatus, nextStores, nextIntelligence] = await Promise.all([api('/onboarding/status'), api('/users/stores/catalog'), api('/intelligence/readiness')]);
      setStatus(nextStatus); setStores(nextStores); setIntelligence(nextIntelligence);
      setImportScope((current) => ({ ...current, storeId: current.storeId || nextStores[0]?.id || '' }));
    } catch (error) { addToast(error.message, 'error'); } finally { setLoading(false); }
  }, [api, addToast]);
  useEffect(() => { load(); }, [load]);

  const secureAction = (description, run) => { setPassword(''); setConfirmAction({ description, run }); };
  const confirm = async (event) => {
    event.preventDefault(); setWorking(true);
    try {
      const result = await reauthenticate({ password });
      await confirmAction.run(result.reauth_token);
      setConfirmAction(null); await Promise.all([load(), refresh()]);
    } catch (error) { addToast(error.message, 'error'); } finally { setWorking(false); }
  };
  const createStore = (event) => {
    event.preventDefault();
    secureAction(`Create store ${storeForm.name}`, async (token) => {
      await api('/onboarding/stores', { method: 'POST', headers: { 'X-Reauth-Token': token }, body: JSON.stringify({ name: storeForm.name, code: storeForm.code, timezone: storeForm.timezone }) });
      setStoreModal(false); setStoreForm({ name: '', code: '', timezone: profile?.timezone || 'Asia/Kolkata' }); addToast('Store created', 'success');
    });
  };
  const addSampleData = () => secureAction('Add reusable evaluation sample data to this business', async (token) => {
    const result = await api('/onboarding/sample-data', { method: 'POST', headers: { 'X-Reauth-Token': token } });
    addToast(`${result.message}. ${result.report.sales} sales records added.`, 'success');
  });
  const trainIntelligence = () => secureAction('Train and refresh intelligence using this business data', async (token) => {
    const result = await api('/intelligence/train', { method: 'POST', headers: { 'X-Reauth-Token': token } });
    addToast(result.message, result.status === 'success' ? 'success' : 'info');
  });
  const chooseFile = (type) => { setSelectedImport(type); setPreview(null); window.setTimeout(() => fileInput.current?.click(), 0); };
  const previewFile = async (event) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file || !selectedImport) return;
    if (selectedImport.store && !importScope.storeId) return addToast('Select a store first', 'error');
    const body = new FormData(); body.append('kind', selectedImport.id); body.append('upload', file);
    if (selectedImport.store) body.append('store_id', importScope.storeId);
    if (selectedImport.seller && importScope.sellerId) body.append('seller_id', importScope.sellerId);
    setWorking(true);
    try { setPreview(await api('/onboarding/imports/preview', { method: 'POST', body })); }
    catch (error) { addToast(error.message, 'error'); } finally { setWorking(false); }
  };
  const commitImport = () => secureAction(`Import ${preview.valid_rows} validated ${preview.kind} rows`, async (token) => {
    const result = await api(`/onboarding/imports/${preview.id}/commit`, { method: 'POST', headers: { 'X-Reauth-Token': token } });
    setPreview(result); addToast(`${result.kind} import completed`, 'success');
  });
  const downloadTemplate = (type) => {
    const blob = new Blob([`${type.columns}\n${type.sample}\n`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${type.id}_template.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  return <div className="space-y-6">
    <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-violet-900 p-7 text-white shadow-xl"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-indigo-200"><Rocket className="h-4 w-4" /> Guided business onboarding</div><h2 className="text-3xl font-bold">Set up {profile?.tenant_name}</h2><p className="mt-2 max-w-2xl text-sm text-indigo-200">Add your stores and business records in the correct order. Every record stays inside this business workspace.</p></div><div className="min-w-56 rounded-2xl bg-white/10 p-4"><div className="flex justify-between text-sm font-bold"><span>Setup progress</span><span>{status?.completion_percentage || 0}%</span></div><div className="mt-3 h-3 rounded-full bg-slate-950/40"><div className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all" style={{ width: `${status?.completion_percentage || 0}%` }} /></div></div></div></div>
    <div className="grid gap-6 lg:grid-cols-3"><Card className="lg:col-span-2" hoverEffect={false}><CardHeader><div><CardTitle>Setup checklist</CardTitle><CardDescription>Complete these steps before relying on analytics and forecasts.</CardDescription></div><ClipboardCheck className="h-5 w-5 text-indigo-500" /></CardHeader><div className="grid gap-3 sm:grid-cols-2">{Object.entries(checklistLabels).map(([key, label]) => <div key={key} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">{status?.checklist?.[key] ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" /> : <div className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-700" />}<span className="text-sm font-semibold">{label}</span></div>)}</div></Card><Card><CardHeader><div><CardTitle>Quick actions</CardTitle><CardDescription>Start with a real setup or evaluation data.</CardDescription></div></CardHeader><div className="space-y-3"><Button className="w-full" icon={Plus} onClick={() => setStoreModal(true)}>Create Another Store</Button><Button className="w-full" variant="secondary" icon={Users} onClick={() => onNavigate('team')}>Invite Team Members</Button><Button className="w-full" variant="outline" icon={WandSparkles} onClick={addSampleData}>Use Sample Data</Button><p className="text-xs leading-relaxed text-slate-500">Sample data is isolated to this business and can be added repeatedly without duplicates.</p></div></Card></div>
    <Card hoverEffect={false}><CardHeader><div><CardTitle>Import your business data</CardTitle><CardDescription>Download a template, select its scope, then preview and validate before importing.</CardDescription></div><Upload className="h-5 w-5 text-indigo-500" /></CardHeader><div className="mb-5 grid gap-4 md:grid-cols-2"><Select label="Target Store" value={importScope.storeId} onChange={(storeId) => setImportScope({ ...importScope, storeId })} options={stores.map((store) => [store.id, `${store.name} (${store.code})`])} /><Select label="Assign Sales/Customers To" value={importScope.sellerId} onChange={(sellerId) => setImportScope({ ...importScope, sellerId })} options={[["", `Business Owner (${profile?.full_name})`], ...sellers.map((seller) => [seller.id, seller.full_name])]} /></div><div className="grid gap-4 md:grid-cols-2">{importTypes.map((type) => { const Icon = type.icon; return <div key={type.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"><div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"><Icon className="h-5 w-5" /></div><Badge variant="info">CSV</Badge></div><h3 className="mt-4 font-bold">{type.title}</h3><p className="mt-1 text-sm text-slate-500">{type.description}</p><p className="mt-3 break-all rounded-lg bg-slate-50 p-2 font-mono text-[10px] text-slate-500 dark:bg-slate-800/60">{type.columns}</p><div className="mt-4 flex gap-2"><Button size="sm" variant="secondary" icon={Download} onClick={() => downloadTemplate(type)}>Template</Button><Button size="sm" icon={Upload} isLoading={working && selectedImport?.id === type.id} onClick={() => chooseFile(type)}>Choose CSV</Button></div></div>; })}</div><input ref={fileInput} type="file" accept=".csv,text/csv" className="hidden" onChange={previewFile} /></Card>
    <div className="grid gap-6 lg:grid-cols-2"><Readiness status={status} /><ImportHistory jobs={status?.recent_imports || []} loading={loading} /></div>
    <IntelligenceTraining intelligence={intelligence} working={working} onTrain={trainIntelligence} />
    <Modal isOpen={storeModal} onClose={() => setStoreModal(false)} title="Create Store"><form onSubmit={createStore} className="space-y-4"><Input label="Store Name" value={storeForm.name} onChange={(event) => setStoreForm({ ...storeForm, name: event.target.value })} required /><Input label="Store Code" placeholder="DEL-02" value={storeForm.code} onChange={(event) => setStoreForm({ ...storeForm, code: event.target.value.toUpperCase() })} required /><Input label="Time Zone" value={storeForm.timezone} onChange={(event) => setStoreForm({ ...storeForm, timezone: event.target.value })} required /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setStoreModal(false)}>Cancel</Button><Button type="submit">Continue</Button></div></form></Modal>
    <Modal isOpen={Boolean(preview)} onClose={() => setPreview(null)} title={`${preview?.kind || ''} import preview`} maxWidth="max-w-4xl">{preview && <div className="space-y-5"><div className="grid grid-cols-3 gap-3"><Summary label="Total rows" value={preview.total_rows} /><Summary label="Valid" value={preview.valid_rows} good /><Summary label="Errors" value={preview.invalid_rows} bad /></div>{preview.preview.length > 0 && <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"><table className="w-full text-left text-xs"><thead><tr>{Object.keys(preview.preview[0]).map((key) => <th key={key} className="bg-slate-50 p-2 font-bold dark:bg-slate-800">{key}</th>)}</tr></thead><tbody>{preview.preview.map((row, index) => <tr key={index}>{Object.values(row).map((value, valueIndex) => <td key={valueIndex} className="border-t border-slate-100 p-2 dark:border-slate-800">{String(value || '—')}</td>)}</tr>)}</tbody></table></div>}{preview.errors.length > 0 && <div className="max-h-40 overflow-y-auto rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{preview.errors.map((error) => <p key={`${error.row}-${error.message}`} className="py-1">Row {error.row}: {error.message}</p>)}</div>}{preview.status === 'imported' ? <div className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">Import completed: {Object.entries(preview.report).map(([key, value]) => `${key} ${value}`).join(' · ')}</div> : <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setPreview(null)}>Cancel</Button><Button icon={Database} disabled={!preview.valid_rows} onClick={commitImport}>Import Valid Rows</Button></div>}</div>}</Modal>
    <Modal isOpen={Boolean(confirmAction)} onClose={() => !working && setConfirmAction(null)} title="Confirm Business Change"><form onSubmit={confirm} className="space-y-4"><p className="text-sm text-slate-500">{confirmAction?.description}. Confirm with your Business Owner password.</p><Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button><Button type="submit" isLoading={working}>Confirm</Button></div></form></Modal>
  </div>;
};

const Select = ({ label, value, onChange, options }) => <label className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-700">{options.map(([key, text]) => <option key={key || 'owner'} value={key}>{text}</option>)}</select></label>;
const Summary = ({ label, value, good, bad }) => <div className={`rounded-xl p-3 ${good ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : bad ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' : 'bg-slate-50 dark:bg-slate-800'}`}><p className="text-xs">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>;
const Readiness = ({ status }) => <Card hoverEffect={false}><CardHeader><div><CardTitle>Analytics readiness</CardTitle><CardDescription>Minimum data checks for reliable business intelligence.</CardDescription></div><Rocket className="h-5 w-5 text-violet-500" /></CardHeader><div className="space-y-3">{Object.entries(status?.forecast_readiness || {}).map(([key, item]) => <div key={key} className="flex gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">{item.ready ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" /> : <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />}<div><p className="text-sm font-bold">{item.label}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{item.detail}</p></div></div>)}</div></Card>;
const ImportHistory = ({ jobs, loading }) => <Card hoverEffect={false}><CardHeader><div><CardTitle>Import activity</CardTitle><CardDescription>Preview, validation and completion results.</CardDescription></div><Database className="h-5 w-5 text-blue-500" /></CardHeader><div className="space-y-3">{jobs.map((job) => <div key={job.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"><div className="min-w-0"><p className="truncate text-sm font-bold">{job.filename}</p><p className="text-xs text-slate-500">{job.kind} · {job.valid_rows}/{job.total_rows} valid</p></div><div className="flex items-center gap-2"><Badge variant={job.status === 'imported' ? 'success' : job.status === 'invalid' ? 'danger' : 'info'}>{job.status}</Badge><ChevronRight className="h-4 w-4 text-slate-400" /></div></div>)}{!jobs.length && <div className="py-10 text-center text-sm text-slate-500">{loading ? 'Checking imports…' : 'No uploads yet. Start with the Product Catalog template.'}</div>}</div></Card>;
const IntelligenceTraining = ({ intelligence, working, onTrain }) => {
  const modules = ['revenue', 'personal', 'demand', 'segmentation'];
  return <Card className="border-indigo-200 dark:border-indigo-900" hoverEffect={false}><CardHeader><div><CardTitle>Train & Refresh Intelligence</CardTitle><CardDescription>Models use only this business workspace. Nothing is published unless data and quality checks pass.</CardDescription></div><BrainCircuit className="h-6 w-6 text-indigo-500" /></CardHeader>{intelligence?.refresh_recommended && <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><AlertTriangle className="h-5 w-5 shrink-0" /><p className="text-sm font-semibold">{intelligence.new_records_since_last_training} sales/customer records changed since the last training run. Refresh is recommended.</p></div>}<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{modules.map((key) => { const item = intelligence?.[key]; return <div key={key} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><div className="flex items-center gap-2">{item?.ready ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}<p className="text-sm font-bold capitalize">{key}</p></div><p className="mt-2 text-xs leading-relaxed text-slate-500">{item?.ready ? `${item.observed_records} eligible records/series are ready.` : item?.blocking_reasons?.[0] || 'Checking data…'}</p></div>; })}</div><div className="mt-5 flex flex-col gap-4 rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-950/30 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" /><div><p className="text-sm font-bold">Truth-first publication</p><p className="mt-1 text-xs text-slate-500">Chronological holdout testing, baseline comparison and segmentation quality gates are mandatory. Rejected results remain off dashboards.</p>{intelligence?.last_job && <p className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-300">Last run: {intelligence.last_job.status}</p>}</div></div><Button icon={BrainCircuit} isLoading={working} disabled={!intelligence?.ready_to_train} onClick={onTrain}>Train & Refresh</Button></div></Card>;
};
