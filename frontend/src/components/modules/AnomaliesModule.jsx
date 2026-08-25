import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  TrendingDown,
  PackageX,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Filter,
  Eye
} from 'lucide-react';

export const AnomaliesModule = () => {
  const { addToast } = useToast();
  const { api } = useAuth();

  const [summary, setSummary] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [resolutionModal, setResolutionModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, anomRes] = await Promise.all([
        api('/anomalies/summary'),
        api('/anomalies?limit=100')
      ]);
      setSummary(sumRes);
      setAnomalies(Array.isArray(anomRes) ? anomRes : (anomRes?.items || []));
    } catch (err) {
      addToast({ title: 'Error loading anomaly alerts', message: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanAndRefresh = async () => {
    setIsScanning(true);
    try {
      await api('/anomalies/scan', { method: 'POST' });
      addToast({
        title: 'Anomaly Scan Completed',
        message: 'Isolation Forest and statistical detectors ran successfully',
        type: 'success'
      });
      await fetchData();
    } catch (err) {
      await fetchData();
      addToast({ title: 'Alerts Refreshed', message: err.message || 'Latest alerts loaded', type: 'info' });
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((a) => {
      const matchesSev = severityFilter === 'all' || a.severity === severityFilter;
      const matchesType = typeFilter === 'all' || a.anomaly_type === typeFilter;
      return matchesSev && matchesType;
    });
  }, [anomalies, severityFilter, typeFilter]);

  const handleUpdateStatus = async (anomalyId, newStatus, notes = '') => {
    setIsUpdating(true);
    try {
      await api(`/anomalies/${anomalyId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, resolution_notes: notes })
      });
      addToast({
        title: 'Status Updated',
        message: `Alert updated to ${newStatus.replace('_', ' ')}`,
        type: 'success'
      });
      setResolutionModal(false);
      setResolutionNotes('');
      fetchData();
    } catch (err) {
      addToast({ title: 'Update failed', message: err.message, type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="danger">Critical Risk</Badge>;
      case 'high':
        return <Badge variant="warning">High Priority</Badge>;
      case 'medium':
        return <Badge variant="neutral">Medium Attention</Badge>;
      default:
        return <Badge variant="neutral">Low</Badge>;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'fraud_risk':
        return <Flame className="w-5 h-5 text-rose-500" />;
      case 'sales_drop':
        return <TrendingDown className="w-5 h-5 text-amber-500" />;
      case 'sales_spike':
        return <Sparkles className="w-5 h-5 text-indigo-500" />;
      case 'inventory_shrinkage':
        return <PackageX className="w-5 h-5 text-rose-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-rose-600 dark:text-rose-400" />
            Operational & Fraud Anomaly Detection
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time machine learning monitoring across sales velocity, suspicious transactions, and stock shrinkage.
          </p>
        </div>

        <Button
          onClick={handleScanAndRefresh}
          variant="secondary"
          icon={Sparkles}
          disabled={isScanning || isLoading}
        >
          {isScanning ? 'Scanning with ML...' : 'Scan & Refresh Alerts'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-rose-50/50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border-rose-100 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Critical Anomalies</p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{summary?.critical_count || 0}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Flame className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50/50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border-amber-100 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Fraud Risks</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{summary?.fraud_risk_count || 0}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border-indigo-100 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Stock Depletions</p>
              <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{summary?.inventory_shrinkage_count || 0}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <PackageX className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50/50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border-emerald-100 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Resolution Rate</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {((summary?.resolution_rate || 0) * 100).toFixed(0)}%
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filterable Feed */}
      <Card>
        <CardHeader
          title="Active Anomaly & Outlier Feed"
          action={
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {['all', 'critical', 'high', 'medium'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverityFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      severityFilter === s
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white"
              >
                <option value="all">All Anomaly Types</option>
                <option value="fraud_risk">Suspicious Transactions</option>
                <option value="sales_drop">Sudden Sales Drops</option>
                <option value="sales_spike">Revenue Spikes</option>
                <option value="inventory_shrinkage">Stock Depletion</option>
              </select>
            </div>
          }
        />

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredAnomalies.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No anomaly alerts found for the selected filters. System operating within normal thresholds.
            </div>
          ) : (
            filteredAnomalies.map((anom) => (
              <div
                key={anom.id}
                className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {getTypeIcon(anom.anomaly_type)}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {anom.title}
                      </h4>
                      {getSeverityBadge(anom.severity)}
                      <span className="text-xs text-slate-400 font-mono">
                        Score: {(anom.score * 100).toFixed(0)}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {anom.description}
                    </p>

                    {anom.status === 'resolved' && (
                      <div className="mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs">
                        <strong>Resolved:</strong> {anom.resolution_notes || 'Marked resolved by operator.'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 md:self-center">
                  {anom.status !== 'resolved' ? (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUpdateStatus(anom.id, 'acknowledged')}
                      >
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setSelectedAnomaly(anom);
                          setResolutionModal(true);
                        }}
                      >
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateStatus(anom.id, 'false_positive', 'Marked as false positive')}
                      >
                        False Alert
                      </Button>
                    </>
                  ) : (
                    <Badge variant="success">Resolved</Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Resolution Modal */}
      <Modal
        isOpen={resolutionModal}
        onClose={() => setResolutionModal(false)}
        title="Resolve Anomaly Alert"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Please provide resolution details for <strong>{selectedAnomaly?.title}</strong>:
          </p>

          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="e.g. Transaction verified with bank payment slip; inventory count adjusted."
            className="w-full h-24 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setResolutionModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleUpdateStatus(selectedAnomaly.id, 'resolved', resolutionNotes)}
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Confirm Resolution'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

