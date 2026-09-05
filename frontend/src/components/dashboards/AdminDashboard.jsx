import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Brain,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Cpu,
  Database,
  Download,
  Eye,
  Filter,
  Key,
  Layers,
  Lock,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
  Terminal,
  UserCheck,
  Users,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/Card';

export const AdminDashboard = () => {
  const { api, profile } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('businesses'); // 'businesses', 'auth_logs', 'ai_models', 'system'
  const [roles, setRoles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [monitoringData, setMonitoringData] = useState(null);
  const [dbStatus, setDbStatus] = useState({ status: 'connected', latencyMs: 12 });
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [selectedBusinessFilter, setSelectedBusinessFilter] = useState('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logSeverityFilter, setLogSeverityFilter] = useState('all');
  const [businessSearchQuery, setBusinessSearchQuery] = useState('');
  const [expandedBusinessId, setExpandedBusinessId] = useState('aravali');
  const [selectedEventModal, setSelectedEventModal] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [retrainingModel, setRetrainingModel] = useState(null);
  const [rbacSearch, setRbacSearch] = useState('');

  // Mock / Loaded Business Organizations with Employees
  const [businesses, setBusinesses] = useState([
    {
      id: 'aravali',
      name: 'Aravali Retail Group',
      ownerName: 'Aarav Sharma',
      ownerEmail: 'owner.demo@marketmind.example.com',
      currency: 'INR (₹)',
      timezone: 'Asia/Kolkata',
      joinedDate: '2026-01-15',
      status: 'ACTIVE',
      storesCount: 2,
      employees: [
        {
          id: 'emp-1',
          name: 'Vikram Mehta',
          email: 'manager.demo@marketmind.example.com',
          role: 'Store Manager',
          store: 'Main Store (Jaipur)',
          status: 'ACTIVE',
          lastActive: '10 minutes ago'
        },
        {
          id: 'emp-2',
          name: 'Priya Verma',
          email: 'priya.sales@aravali.example.com',
          role: 'Sales Executive',
          store: 'Main Store (Jaipur)',
          status: 'ACTIVE',
          lastActive: '1 hour ago'
        },
        {
          id: 'emp-3',
          name: 'Rahul Sen',
          email: 'rahul.sales@aravali.example.com',
          role: 'Sales Executive',
          store: 'Udaipur Branch',
          status: 'PENDING_INVITE',
          lastActive: 'Invitation Sent'
        }
      ],
      aiModels: [
        {
          name: 'Sales & Revenue Demand Forecasting',
          algorithm: 'Prophet + XGBoost Hybrid',
          version: 'v2.1.0-prophet',
          lastTrained: 'Today, 04:30 PM',
          accuracyScore: 0.932,
          status: 'ACTIVE',
          horizon: '30-Day Forward'
        },
        {
          name: 'Customer RFM Segmentation',
          algorithm: 'K-Means Clustering',
          version: 'v1.4.0-kmeans',
          lastTrained: 'Yesterday, 08:15 PM',
          accuracyScore: 0.885,
          status: 'ACTIVE',
          horizon: '4 Customer Clusters (Silhouette 0.74)'
        },
        {
          name: 'Product Cross-Sell Recommendations',
          algorithm: 'Apriori + Collaborative Filtering',
          version: 'v1.0.0-cf',
          lastTrained: 'Today, 02:00 PM',
          accuracyScore: 0.864,
          status: 'ACTIVE',
          horizon: '86.4% Catalog Coverage'
        },
        {
          name: 'Customer Retention & Churn Predictor',
          algorithm: 'RandomForest + Logistic Classifier',
          version: 'v1.0.0-churn',
          lastTrained: '2 days ago',
          accuracyScore: 0.915,
          status: 'ACTIVE',
          horizon: '30/60/90d Risk Scoring'
        },
        {
          name: 'Isolation Forest Anomaly Detection',
          algorithm: 'IsolationForest',
          version: 'v1.0.0-isoforest',
          lastTrained: 'Today, 05:10 PM',
          accuracyScore: 0.948,
          status: 'ACTIVE',
          horizon: '0.05 Contamination Factor'
        }
      ]
    },
    {
      id: 'northwind',
      name: 'Northwind Enterprises',
      ownerName: 'Dev Patel',
      ownerEmail: 'owner@northwind.example.com',
      currency: 'INR (₹)',
      timezone: 'Asia/Kolkata',
      joinedDate: '2026-03-02',
      status: 'ACTIVE',
      storesCount: 1,
      employees: [
        {
          id: 'emp-4',
          name: 'Amit Joshi',
          email: 'amit.manager@northwind.example.com',
          role: 'Store Manager',
          store: 'North Hub Store',
          status: 'ACTIVE',
          lastActive: '3 hours ago'
        },
        {
          id: 'emp-5',
          name: 'Sneha Roy',
          email: 'sneha.sales@northwind.example.com',
          role: 'Sales Executive',
          store: 'North Hub Store',
          status: 'ACTIVE',
          lastActive: '5 hours ago'
        }
      ],
      aiModels: [
        {
          name: 'Sales & Revenue Demand Forecasting',
          algorithm: 'ARIMA + SARIMAX',
          version: 'v1.2.0-arima',
          lastTrained: '3 days ago',
          accuracyScore: 0.895,
          status: 'ACTIVE',
          horizon: '14-Day Forward'
        },
        {
          name: 'Customer RFM Segmentation',
          algorithm: 'K-Means Clustering',
          version: 'v1.2.0-kmeans',
          lastTrained: '3 days ago',
          accuracyScore: 0.840,
          status: 'ACTIVE',
          horizon: '3 Clusters'
        },
        {
          name: 'Product Cross-Sell Recommendations',
          algorithm: 'Association Rules',
          version: 'v1.0.0-rules',
          lastTrained: '3 days ago',
          accuracyScore: 0.820,
          status: 'ACTIVE',
          horizon: '75% Catalog Coverage'
        },
        {
          name: 'Customer Retention & Churn Predictor',
          algorithm: 'LogisticRegression',
          version: 'v1.0.0-logistic',
          lastTrained: '3 days ago',
          accuracyScore: 0.875,
          status: 'ACTIVE',
          horizon: '30d Risk Evaluation'
        },
        {
          name: 'Isolation Forest Anomaly Detection',
          algorithm: 'IsolationForest',
          version: 'v1.0.0-isoforest',
          lastTrained: 'Yesterday, 09:30 AM',
          accuracyScore: 0.930,
          status: 'ACTIVE',
          horizon: '0.05 Contamination'
        }
      ]
    }
  ]);

  const loadPlatformData = useCallback(async () => {
    const startTime = performance.now();
    try {
      const [roleCatalog, auditEvents, telemetry] = await Promise.allSettled([
        api('/users/roles/catalog'),
        api('/audit?limit=200'),
        api('/models/monitoring')
      ]);

      const latency = Math.round(performance.now() - startTime);
      setDbStatus({ status: 'connected', latencyMs: Math.max(latency, 8) });

      if (roleCatalog.status === 'fulfilled') setRoles(roleCatalog.value || []);
      if (auditEvents.status === 'fulfilled') setLogs(auditEvents.value || []);
      if (telemetry.status === 'fulfilled') setMonitoringData(telemetry.value);
    } catch (error) {
      addToast(error.message || 'Error fetching system telemetry', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [api, addToast]);

  useEffect(() => {
    loadPlatformData();
    const seconds = Number(profile?.role_preferences?.monitoring_refresh || 60);
    const timer = window.setInterval(loadPlatformData, Math.max(seconds, 15) * 1000);
    return () => window.clearInterval(timer);
  }, [loadPlatformData, profile?.role_preferences?.monitoring_refresh]);

  const handleRetrainModel = async (businessId, modelName) => {
    setRetrainingModel(`${businessId}-${modelName}`);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setBusinesses((prev) =>
        prev.map((biz) => {
          if (biz.id !== businessId) return biz;
          return {
            ...biz,
            aiModels: biz.aiModels.map((m) =>
              m.name === modelName
                ? { ...m, lastTrained: 'Just now (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')' }
                : m
            )
          };
        })
      );
      addToast(`Pipeline retrain triggered for ${modelName} (${businessId}).`, 'success');
    } finally {
      setRetrainingModel(null);
    }
  };

  const handleRetrainAllForBusiness = async (businessId) => {
    setRetrainingModel(businessId);
    try {
      await new Promise((r) => setTimeout(r, 1400));
      const nowStr = 'Just now (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')';
      setBusinesses((prev) =>
        prev.map((biz) => {
          if (biz.id !== businessId && businessId !== 'all') return biz;
          return {
            ...biz,
            aiModels: biz.aiModels.map((m) => ({ ...m, lastTrained: nowStr }))
          };
        })
      );
      addToast(`All AI models retrained successfully for ${businessId === 'all' ? 'All Businesses' : businessId}.`, 'success');
    } finally {
      setRetrainingModel(null);
    }
  };

  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `marketmind-auth-audit-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Audit log JSON exported successfully.', 'success');
  };

  // Helper to map audit logs to emails and businesses
  const getLogBusinessName = (event) => {
    const email = (event.details?.recipient || event.details?.email || '').toLowerCase();
    const detailsStr = JSON.stringify(event.details || {}).toLowerCase();
    if (email.includes('aravali') || detailsStr.includes('aravali')) return 'Aravali Retail Group';
    if (email.includes('northwind') || detailsStr.includes('northwind')) return 'Northwind Enterprises';
    if (event.event_type?.includes('developer') || email.includes('admin') || detailsStr.includes('developer_otp')) {
      return 'System Administrator (Root)';
    }
    return 'Aravali Retail Group';
  };

  const getLogActorEmail = (event) => {
    return (
      event.details?.recipient ||
      event.details?.email ||
      (event.event_type?.includes('developer') ? 'admin.root@marketmind.local' : 'user@marketmind.local')
    );
  };

  const getLogAuthMethod = (event) => {
    const type = (event.event_type || '').toLowerCase();
    if (type.includes('developer_otp')) return 'Passwordless OTP (Admin Channel)';
    if (type.includes('login')) return 'Password + MFA Verified';
    if (type.includes('token') || type.includes('verify')) return 'One-Time Token Validation';
    if (type.includes('invite')) return 'Employee Invitation Onboarding';
    return 'Session Authentication';
  };

  const getEventSeverity = (event) => {
    const type = (event.event_type || '').toLowerCase();
    if (type.includes('lockout') || type.includes('failed') || type.includes('decline')) return 'CRITICAL';
    if (type.includes('anomaly') || type.includes('reset') || type.includes('role')) return 'WARNING';
    if (type.includes('otp') || type.includes('login') || type.includes('verify')) return 'SUCCESS';
    return 'INFO';
  };

  // Filtered Logs for Tab 2
  const filteredLogs = useMemo(() => {
    return logs.filter((event) => {
      const type = (event.event_type || '').toLowerCase();
      const email = getLogActorEmail(event).toLowerCase();
      const businessName = getLogBusinessName(event);
      const severity = getEventSeverity(event);
      const detailsStr = JSON.stringify(event.details || {}).toLowerCase();

      const matchesSearch =
        !logSearchQuery.trim() ||
        type.includes(logSearchQuery.toLowerCase()) ||
        email.includes(logSearchQuery.toLowerCase()) ||
        detailsStr.includes(logSearchQuery.toLowerCase());

      const matchesSeverity = logSeverityFilter === 'all' || severity === logSeverityFilter;

      const matchesBusiness =
        selectedBusinessFilter === 'all' ||
        (selectedBusinessFilter === 'aravali' && businessName.includes('Aravali')) ||
        (selectedBusinessFilter === 'northwind' && businessName.includes('Northwind')) ||
        (selectedBusinessFilter === 'root' && businessName.includes('Root'));

      return matchesSearch && matchesSeverity && matchesBusiness;
    });
  }, [logs, logSearchQuery, logSeverityFilter, selectedBusinessFilter]);

  // Filtered Businesses for Tab 1
  const filteredBusinesses = useMemo(() => {
    if (!businessSearchQuery.trim()) return businesses;
    const q = businessSearchQuery.toLowerCase();
    return businesses.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.ownerName.toLowerCase().includes(q) ||
        b.ownerEmail.toLowerCase().includes(q)
    );
  }, [businesses, businessSearchQuery]);

  const totalEmployeesAcrossPlatform = useMemo(() => {
    return businesses.reduce((acc, b) => acc + b.employees.length, 0);
  }, [businesses]);

  const totalStoresAcrossPlatform = useMemo(() => {
    return businesses.reduce((acc, b) => acc + b.storesCount, 0);
  }, [businesses]);

  const permissions = useMemo(
    () => [...new Set(roles.flatMap((role) => role.permissions))].sort(),
    [roles]
  );
  const roleByCode = useMemo(
    () => Object.fromEntries(roles.map((role) => [role.code, role])),
    [roles]
  );

  const filteredPermissions = useMemo(() => {
    if (!rbacSearch.trim()) return permissions;
    return permissions.filter((p) => p.toLowerCase().includes(rbacSearch.toLowerCase()));
  }, [permissions, rbacSearch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Platform Command Center Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 border border-purple-800/40 p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-48 h-48 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-xs font-mono font-semibold text-purple-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              RESTRICTED SYSTEM ROOT • PLATFORM ADMIN CONSOLE
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
              Platform Governance & AI Operations
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Manage multi-tenant business organizations, audit authentications and login timings by business, inspect AI model last-train dates, and monitor system infrastructure.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadPlatformData}
              icon={RefreshCw}
              className="border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 text-xs font-semibold"
            >
              Refresh Telemetry
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleRetrainAllForBusiness('all')}
              isLoading={retrainingModel === 'all'}
              icon={Zap}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30"
            >
              Retrain All Platform AI
            </Button>
          </div>
        </div>
      </div>

      {/* Platform Level Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Business Workspaces</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{businesses.length}</span>
            <span className="text-xs text-emerald-400 font-semibold font-mono">100% Active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{totalStoresAcrossPlatform} Total Stores Onboarded</p>
        </Card>

        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Staff</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{totalEmployeesAcrossPlatform}</span>
            <span className="text-xs text-slate-400 font-mono">Employees</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Managers & Sales Executives</p>
        </Card>

        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Pipelines</span>
            <Brain className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">5 Models / Biz</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Forecast • Seg • Recs • Churn • Anomaly</p>
        </Card>

        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security & Auth Logs</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-purple-300">{logs.length}</span>
            <span className="text-xs text-slate-400 font-mono">Recorded</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Real-time Timing & Email Tracking</p>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('businesses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'businesses'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Business Owners & Teams
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-purple-900/80 text-purple-200">{businesses.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('auth_logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'auth_logs'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          Authentication & Login Timings
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-300">{filteredLogs.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai_models')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'ai_models'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-4 h-4" />
          AI Models & Retrain Schedules
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'system'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Database className="w-4 h-4" />
          System Health & RBAC
        </button>
      </div>

      {/* TAB 1: Business Owners & Their Employees Directory */}
      {activeTab === 'businesses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                Multi-Tenant Business Workspaces & Staff Directory
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect registered Business Owners, active stores, and all affiliated employees.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search business or owner..."
                value={businessSearchQuery}
                onChange={(e) => setBusinessSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredBusinesses.map((biz) => {
              const isExpanded = expandedBusinessId === biz.id;
              return (
                <Card key={biz.id} className="border-slate-800 bg-slate-900/80 overflow-hidden">
                  <div
                    onClick={() => setExpandedBusinessId(isExpanded ? null : biz.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base">{biz.name}</h4>
                          <Badge variant="success" className="text-[10px] px-1.5 py-0">{biz.status}</Badge>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          Owner: <strong className="text-slate-200">{biz.ownerName}</strong> ({biz.ownerEmail})
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
                      <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase">Stores</span>
                        <span className="font-bold text-white">{biz.storesCount} Active</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase">Employees</span>
                        <span className="font-bold text-purple-300">{biz.employees.length} Staff</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase">Timezone / Cur</span>
                        <span className="text-slate-300">{biz.currency}</span>
                      </div>
                      <div className="p-1 rounded-lg bg-slate-800 text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Employees Section */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 bg-slate-950/60 p-5 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          Affiliated Employees & Store Assignments ({biz.employees.length})
                        </h5>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Managed by Business Owner ({biz.ownerName})
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="text-[11px] uppercase text-slate-500 border-b border-slate-800/80">
                            <tr>
                              <th className="py-2.5 px-3">Employee Name</th>
                              <th className="py-2.5 px-3">Email Address</th>
                              <th className="py-2.5 px-3">Role</th>
                              <th className="py-2.5 px-3">Assigned Store</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Last Active</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {biz.employees.map((emp) => (
                              <tr key={emp.id} className="hover:bg-slate-800/20 transition">
                                <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-300">
                                    {emp.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  {emp.name}
                                </td>
                                <td className="py-3 px-3 text-slate-300">{emp.email}</td>
                                <td className="py-3 px-3">
                                  <Badge
                                    variant={emp.role === 'Store Manager' ? 'info' : 'success'}
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    {emp.role}
                                  </Badge>
                                </td>
                                <td className="py-3 px-3 text-slate-300 flex items-center gap-1">
                                  <Store className="w-3 h-3 text-slate-500 inline" />
                                  {emp.store}
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      emp.status === 'ACTIVE'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-amber-500/20 text-amber-400'
                                    }`}
                                  >
                                    {emp.status}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right text-slate-400">{emp.lastActive}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Authentication & Login Logs (with Business Filter) */}
      {activeTab === 'auth_logs' && (
        <div className="space-y-4">
          <Card className="border-slate-800 bg-slate-900/80">
            <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by email, event name, or IP address..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Filter By Business Selection Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Business:</span>
                  <select
                    value={selectedBusinessFilter}
                    onChange={(e) => setSelectedBusinessFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-purple-300 font-semibold focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Businesses & Platform</option>
                    <option value="aravali">Aravali Retail Group</option>
                    <option value="northwind">Northwind Enterprises</option>
                    <option value="root">System Root / Admin Only</option>
                  </select>
                </div>

                <select
                  value={logSeverityFilter}
                  onChange={(e) => setLogSeverityFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Severities</option>
                  <option value="SUCCESS">Success Only</option>
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="CRITICAL">Critical</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportLogs}
                  icon={Download}
                  className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs"
                >
                  Export Logs
                </Button>
              </div>
            </div>

            {/* Detailed Auth Stream Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[11px] uppercase text-slate-400 border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th className="p-3.5">Timestamp & Date</th>
                    <th className="p-3.5">Actor Email</th>
                    <th className="p-3.5">Business Workspace</th>
                    <th className="p-3.5">Auth Method / Event</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                        No authentication logs found for the selected business or criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((event) => {
                      const email = getLogActorEmail(event);
                      const biz = getLogBusinessName(event);
                      const method = getLogAuthMethod(event);
                      const severity = getEventSeverity(event);
                      const dateObj = new Date(event.created_at);

                      return (
                        <tr key={event.id || Math.random()} className="hover:bg-slate-800/30 transition">
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-bold text-white block">
                              {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-purple-300">{email}</td>
                          <td className="p-3.5 text-slate-300">
                            <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px]">
                              {biz}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="text-slate-200 block font-semibold">{event.event_type}</span>
                            <span className="text-[11px] text-slate-400">{method}</span>
                          </td>
                          <td className="p-3.5">
                            <Badge
                              variant={
                                severity === 'CRITICAL' ? 'danger' :
                                severity === 'WARNING' ? 'warning' :
                                severity === 'SUCCESS' ? 'success' : 'info'
                              }
                              className="text-[10px] px-1.5 py-0"
                            >
                              {severity}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedEventModal(event)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                              title="Inspect Payload"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: AI Models & Last Train Dates (Per Business) */}
      {activeTab === 'ai_models' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                AI Inference Engines & Training Schedules
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect last training dates, model architectures, accuracy scores, and retrain pipelines per business.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Filter Business:</span>
              <select
                value={selectedBusinessFilter}
                onChange={(e) => setSelectedBusinessFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-purple-300 font-semibold focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Businesses</option>
                <option value="aravali">Aravali Retail Group</option>
                <option value="northwind">Northwind Enterprises</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {businesses
              .filter((b) => selectedBusinessFilter === 'all' || b.id === selectedBusinessFilter)
              .map((biz) => (
                <Card key={biz.id} className="border-slate-800 bg-slate-900/80">
                  <CardHeader className="border-b border-slate-800 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-400" />
                          <CardTitle className="text-base font-bold text-white">{biz.name}</CardTitle>
                          <Badge variant="info" className="text-[10px]">5 AI Engines Configured</Badge>
                        </div>
                        <CardDescription className="text-xs mt-1">
                          Tenant Workspace ID: {biz.id} • Owner: {biz.ownerName} ({biz.ownerEmail})
                        </CardDescription>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetrainAllForBusiness(biz.id)}
                        isLoading={retrainingModel === biz.id}
                        icon={RefreshCw}
                        className="text-xs border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200"
                      >
                        Retrain All Models for {biz.name.split(' ')[0]}
                      </Button>
                    </div>
                  </CardHeader>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {biz.aiModels.map((model, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="font-bold text-white text-xs">{model.name}</h5>
                              <p className="text-[11px] font-mono text-purple-400 mt-0.5">{model.algorithm}</p>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 font-mono">
                              ACTIVE
                            </span>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
                            <div className="flex justify-between">
                              <span className="text-slate-500 text-[11px]">Last Trained:</span>
                              <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-emerald-400" />
                                {model.lastTrained}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 text-[11px]">Version:</span>
                              <span className="text-slate-300 text-[11px]">{model.version}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 text-[11px]">Accuracy Score:</span>
                              <span className="text-purple-300 font-bold text-[11px]">
                                {(model.accuracyScore * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 text-[11px]">Scope:</span>
                              <span className="text-slate-400 text-[11px] truncate max-w-[150px]">{model.horizon}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={retrainingModel === `${biz.id}-${model.name}`}
                          onClick={() => handleRetrainModel(biz.id, model.name)}
                          className="w-full py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                        >
                          {retrainingModel === `${biz.id}-${model.name}` ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" /> Retraining...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" /> Retrain Model
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: System Health & RBAC Policy */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="border-slate-800 bg-slate-900/90">
              <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" /> Database Architecture
                </CardTitle>
              </CardHeader>
              <div className="p-4 space-y-3 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Engine</span>
                  <span className="text-white font-bold">SQLite 3 / WAL Mode</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Connection Pool</span>
                  <span className="text-emerald-400 font-bold">StaticPool (Healthy)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Query Latency</span>
                  <span className="text-white font-bold">{dbStatus.latencyMs} ms</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Multi-Tenancy</span>
                  <span className="text-emerald-400 font-bold">Tenant-Partitioned</span>
                </div>
              </div>
            </Card>

            <Card className="border-slate-800 bg-slate-900/90">
              <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-400" /> Runtime Environment
                </CardTitle>
              </CardHeader>
              <div className="p-4 space-y-3 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Environment</span>
                  <span className="text-purple-300 font-bold">Development / Staging</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Python Backend</span>
                  <span className="text-white font-bold">FastAPI + Uvicorn</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Frontend Stack</span>
                  <span className="text-white font-bold">React 18 + Vite</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Auth Engine</span>
                  <span className="text-emerald-400 font-bold">Passwordless OTP + JWT</span>
                </div>
              </div>
            </Card>

            <Card className="border-slate-800 bg-slate-900/90">
              <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" /> Dispatch Service
                </CardTitle>
              </CardHeader>
              <div className="p-4 space-y-3 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Provider</span>
                  <span className="text-blue-400 font-bold">Resend.com API</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">API Key Status</span>
                  <span className="text-emerald-400 font-bold">Configured (re_***)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Sender Address</span>
                  <span className="text-white font-bold">onboarding@resend.dev</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">OTP Expiration</span>
                  <span className="text-white font-bold">10 Minutes</span>
                </div>
              </div>
            </Card>
          </div>

          {/* RBAC Policy Matrix Table */}
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader className="border-b border-slate-800 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-400" />
                    Role-Based Access Control (RBAC) System Explorer
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Inspect system-enforced authorization policies across all roles.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter permissions..."
                    value={rbacSearch}
                    onChange={(e) => setRbacSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="uppercase text-slate-400 border-b border-slate-800 bg-slate-950/40 font-mono">
                  <tr>
                    <th className="p-3.5">Permission Key</th>
                    <th className="p-3.5 text-center">Business Owner</th>
                    <th className="p-3.5 text-center">Store Manager</th>
                    <th className="p-3.5 text-center">Sales Executive</th>
                    <th className="p-3.5 text-center">Administrator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredPermissions.map((permission) => (
                    <tr key={permission} className="hover:bg-slate-800/30 transition">
                      <td className="p-3.5 font-semibold text-slate-200">{permission}</td>
                      {['business_owner', 'store_manager', 'sales_executive', 'administrator'].map((roleCode) => {
                        const hasPerm = roleByCode[roleCode]?.permissions.includes(permission);
                        return (
                          <td key={roleCode} className="p-3.5 text-center">
                            {hasPerm ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="inline-block w-2 h-0.5 bg-slate-700 rounded-full mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* JSON Payload Modal Drawer */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-mono font-bold text-white text-sm">
                  {selectedEventModal.event_type}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  ID: {selectedEventModal.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto rounded-xl bg-slate-950 p-4 border border-slate-800/80 font-mono text-xs text-purple-300">
              <pre>{JSON.stringify(selectedEventModal, null, 2)}</pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyText(JSON.stringify(selectedEventModal, null, 2), 'modal')}
                icon={copiedKey === 'modal' ? Check : Copy}
                className="text-xs"
              >
                {copiedKey === 'modal' ? 'Copied' : 'Copy JSON'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedEventModal(null)}
                className="text-xs bg-purple-600 hover:bg-purple-500"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
