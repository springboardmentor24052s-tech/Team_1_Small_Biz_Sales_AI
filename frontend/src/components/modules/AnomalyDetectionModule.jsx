import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, ShieldAlert, Activity, CheckCircle, RefreshCw, 
  Eye, CheckSquare, Search, Filter, AlertCircle, Info
} from 'lucide-react';
import { anomalyService } from '../../services/anomalyService';
import { useToast } from '../../context/ToastContext';

export const AnomalyDetectionModule = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [contamination, setContamination] = useState(0.05);
  const { addToast } = useToast();

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const severityParam = filterSeverity === 'all' ? null : filterSeverity;
      const data = await anomalyService.getAnomalies(null, severityParam, contamination);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load anomaly detection data:', err);
      addToast('Error fetching anomaly events', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [filterSeverity, contamination]);

  const handleStatusChange = async (eventId, action) => {
    try {
      if (action === 'acknowledge') {
        await anomalyService.acknowledgeAnomaly(eventId);
        addToast('Anomaly event marked as acknowledged', 'info');
      } else {
        await anomalyService.resolveAnomaly(eventId);
        addToast('Anomaly event successfully resolved', 'success');
      }
      fetchAnomalies();
    } catch (err) {
      addToast(`Failed to ${action} anomaly event`, 'error');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 p-6 rounded-2xl border border-rose-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Isolation Forest Anomaly Detection</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Real-time operational fraud alerts, inventory shrinkage, and forecast residual scanning
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchAnomalies}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Run Detection Scan
        </button>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-sm font-medium">Flagged Anomalies</span>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-white">{summary.total_anomalies_detected}</div>
            <div className="text-xs text-slate-400 mt-2 font-medium">Model: {summary.algorithm}</div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur border border-rose-500/30 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-rose-500/10 rounded-full blur-xl"></div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-sm font-medium text-rose-400">Critical Alerts</span>
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <div className="text-3xl font-bold text-rose-400">{summary.critical_count}</div>
            <div className="text-xs text-rose-400/80 mt-2 font-medium">Action required immediately</div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur border border-amber-500/30 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-sm font-medium text-amber-400">Warning Anomalies</span>
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-amber-400">{summary.warning_count}</div>
            <div className="text-xs text-amber-400/80 mt-2 font-medium">Operational warnings</div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-sm font-medium">Unresolved Incidents</span>
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-3xl font-bold text-indigo-400">{summary.unresolved_count}</div>
            <div className="text-xs text-indigo-400/80 mt-2 font-medium">Pending investigation</div>
          </div>
        </div>
      )}

      {/* Model Insights Box */}
      {summary?.insights && summary.insights.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/30 via-slate-900 to-rose-950/30 border border-rose-500/20 p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-rose-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-400" /> ML Isolation Forest Insights & Sensitivity Rules
          </h3>
          <ul className="space-y-1.5 text-sm text-slate-300">
            {summary.insights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filter Controls & Anomaly Event Cards */}
      <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Severity Level:</span>
            {['all', 'critical', 'warning', 'info'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterSeverity === sev
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Contamination Rate:</span>
            <select
              value={contamination}
              onChange={(e) => setContamination(parseFloat(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="0.02">2% (Strict)</option>
              <option value="0.05">5% (Balanced Standard)</option>
              <option value="0.10">10% (High Sensitivity)</option>
            </select>
          </div>
        </div>

        {/* Anomaly Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 py-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-rose-400" />
              Scanning dataset with Isolation Forest...
            </div>
          ) : summary?.items?.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-slate-500">
              No anomaly events match the selected severity filter.
            </div>
          ) : (
            summary?.items?.map((item) => (
              <div 
                key={item.id} 
                className={`p-5 rounded-2xl border transition-all ${
                  item.severity === 'Critical'
                    ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                    : item.severity === 'Warning'
                    ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      item.severity === 'Critical'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : item.severity === 'Warning'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}>
                      {item.severity}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{item.anomaly_type}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Score: {item.anomaly_score}</span>
                </div>

                <h4 className="text-base font-bold text-white mb-1">{item.title}</h4>
                <p className="text-xs text-slate-300 mb-4">{item.description}</p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-500 font-mono">ID: {item.entity_id}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange(item.id, 'acknowledge')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md font-medium transition-colors"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleStatusChange(item.id, 'resolve')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium transition-colors flex items-center gap-1"
                    >
                      <CheckSquare className="w-3.5 h-3.5" /> Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
