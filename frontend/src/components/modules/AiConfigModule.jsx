import React, { useEffect, useState } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  Sliders,
  Sparkles,
  RefreshCw,
  Cpu,
  Save,
  CheckCircle2,
  BarChart,
  Shield,
  Activity,
  Layers
} from 'lucide-react';

export const AiConfigModule = () => {
  const { addToast } = useToast();
  const { api } = useAuth();

  const [registryData, setRegistryData] = useState(null);
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await api('/admin/ai-config');
      setRegistryData(res.models || []);
      setConfig(res.config || {});
    } catch (err) {
      addToast({ title: 'Failed to load AI config', message: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api('/admin/ai-config', {
        method: 'PUT',
        body: JSON.stringify(config)
      });
      setConfig(updated);
      addToast({ title: 'AI Configuration Saved', message: 'Hyperparameters and sensitivity thresholds updated.', type: 'success' });
    } catch (err) {
      addToast({ title: 'Save failed', message: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerRetrain = async () => {
    setIsRetraining(true);
    try {
      const res = await api('/admin/ai-config/retrain', {
        method: 'POST',
        body: JSON.stringify({ modules: ['churn', 'recommendations', 'anomalies'] })
      });
      addToast({ title: 'Retraining Complete', message: 'All machine learning pipelines re-evaluated successfully.', type: 'success' });
      fetchConfig();
    } catch (err) {
      addToast({ title: 'Retraining failed', message: err.message, type: 'error' });
    } finally {
      setIsRetraining(false);
    }
  };

  if (isLoading && !config) {
    return <div className="p-8 text-center text-slate-400">Loading AI configuration and model registry...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Cpu className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            AI & Machine Learning Engine Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            System administrator controls for tuning classification thresholds, retraining pipelines, and tracking model metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleTriggerRetrain}
            variant="primary"
            icon={RefreshCw}
            disabled={isRetraining}
          >
            {isRetraining ? 'Retraining Pipelines...' : 'Trigger Full Retraining'}
          </Button>
        </div>
      </div>

      {/* Model Registry Table */}
      <Card>
        <CardHeader
          title="Active Model Registry & Validation Performance"
          subtitle="Real-time status of all active machine learning models across tenant operations"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-y border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Capability / Module</th>
                <th className="py-3.5 px-4">Algorithm</th>
                <th className="py-3.5 px-4">Model Version</th>
                <th className="py-3.5 px-4">Primary Metric</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Trained</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-xs">
              {(registryData || []).map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    {m.module}
                  </td>
                  <td className="py-3 px-4 font-medium">{m.algorithm}</td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{m.model_version}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                    {m.accuracy !== undefined && m.accuracy !== null && `Accuracy: ${(m.accuracy * 100).toFixed(1)}%`}
                    {m.precision_at_k !== undefined && m.precision_at_k !== null && `P@K: ${(m.precision_at_k * 100).toFixed(1)}%`}
                    {m.detection_rate !== undefined && m.detection_rate !== null && `Det. Rate: ${(m.detection_rate * 100).toFixed(1)}%`}
                    {m.silhouette_score !== undefined && m.silhouette_score !== null && `Silhouette: ${m.silhouette_score.toFixed(2)}`}
                    {!m.accuracy && !m.precision_at_k && !m.detection_rate && !m.silhouette_score && 'Matured'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="success">Active</Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {m.trained_at ? m.trained_at.slice(0, 16).replace('T', ' ') : 'Live'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Hyperparameter Tuning Form */}
      {config && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Churn Prediction Tuning */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Activity className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Churn Prediction Hyperparameters</h3>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  High Risk Threshold Probability ({((config.churn?.high_risk_threshold || 0.70) * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  min="0.50"
                  max="0.90"
                  step="0.05"
                  value={config.churn?.high_risk_threshold || 0.70}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      churn: { ...config.churn, high_risk_threshold: parseFloat(e.target.value) }
                    })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Inactivity Window (Days): {config.churn?.inactivity_threshold_days || 90}
                </label>
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="15"
                  value={config.churn?.inactivity_threshold_days || 90}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      churn: { ...config.churn, inactivity_threshold_days: parseInt(e.target.value) }
                    })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
            </Card>

            {/* Recommendation Engine Tuning */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recommendation Rules Tuning</h3>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Minimum Rule Confidence ({((config.recommendations?.min_confidence || 0.05) * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  min="0.01"
                  max="0.30"
                  step="0.01"
                  value={config.recommendations?.min_confidence || 0.05}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      recommendations: { ...config.recommendations, min_confidence: parseFloat(e.target.value) }
                    })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Top-K Recommendations Count: {config.recommendations?.top_k || 5}
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  step="1"
                  value={config.recommendations?.top_k || 5}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      recommendations: { ...config.recommendations, top_k: parseInt(e.target.value) }
                    })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
            </Card>

            {/* Anomaly Detection Tuning */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Shield className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Anomaly Detection Sensitivity</h3>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Isolation Forest Contamination Rate ({((config.anomalies?.contamination || 0.05) * 100).toFixed(1)}%)
                </label>
                <input
                  type="range"
                  min="0.01"
                  max="0.15"
                  step="0.01"
                  value={config.anomalies?.contamination || 0.05}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      anomalies: { ...config.anomalies, contamination: parseFloat(e.target.value) }
                    })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Trend Outlier Z-Score Threshold: {config.anomalies?.z_score_threshold || 2.5}σ
                </label>
                <input
                  type="range"
                  min="1.5"
                  max="4.0"
                  step="0.1"
                  value={config.anomalies?.z_score_threshold || 2.5}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      anomalies: { ...config.anomalies, z_score_threshold: parseFloat(e.target.value) }
                    })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
            </Card>

            {/* Segmentation & Forecasting Tuning */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Layers className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Segmentation & Forecasting</h3>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  K-Means Customer Clusters: {config.segmentation?.clusters_k || 4}
                </label>
                <input
                  type="range"
                  min="3"
                  max="6"
                  step="1"
                  value={config.segmentation?.clusters_k || 4}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      segmentation: { ...config.segmentation, clusters_k: parseInt(e.target.value) }
                    })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500">
                Changes apply automatically to all future training cycles and realtime inference requests.
              </div>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" type="submit" icon={Save} disabled={isSaving}>
              {isSaving ? 'Saving Changes...' : 'Save AI Hyperparameters'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

