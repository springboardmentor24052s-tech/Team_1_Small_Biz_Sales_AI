import React, { useState, useEffect } from 'react';
import { 
  Users, AlertTriangle, ShieldAlert, UserX, TrendingDown, 
  CheckCircle, ArrowUpRight, Search, RefreshCw, Mail, PhoneCall, Filter
} from 'lucide-react';
import { churnService } from '../../services/churnService';
import { useToast } from '../../context/ToastContext';

export const ChurnPredictionModule = () => {
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  const fetchChurnData = async () => {
    setLoading(true);
    try {
      const summaryData = await churnService.getChurnSummary();
      setSummary(summaryData);

      const riskFilterParam = filterRisk === 'all' ? null : filterRisk;
      const customerData = await churnService.getChurnCustomers(null, riskFilterParam, 50, 0);
      setCustomers(customerData.items || []);
    } catch (err) {
      console.error('Failed to load churn data:', err);
      addToast('Error loading churn prediction data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChurnData();
  }, [filterRisk]);

  const handleAction = (customer, actionType) => {
    addToast(`${actionType} initiated for ${customer.external_customer_id}`, 'success');
  };

  const filteredCustomers = customers.filter(c => 
    (c.external_customer_id || c.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.retention_recommendation || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">At-Risk Customer Retention Center</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Identify slipping accounts early and launch 1-click discount offers or executive calls to protect your revenue.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchChurnData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Retention AI
        </button>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-sm font-medium">Analyzed Accounts</span>
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-3xl font-bold text-white">{summary.total_customers_analyzed}</div>
            <div className="text-xs text-indigo-400 mt-2 font-medium">Engine: Retention Risk AI</div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur border border-red-500/30 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-red-500/10 rounded-full blur-xl"></div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-sm font-medium text-red-400">High Risk Churn</span>
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-red-400">{summary.high_risk_count}</div>
            <div className="text-xs text-red-400/80 mt-2 font-medium">Requires immediate intervention</div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur border border-amber-500/30 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-sm font-medium text-amber-400">Revenue at Risk</span>
              <TrendingDown className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-amber-400">
              ₹{Number(summary.potential_revenue_at_risk || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-amber-400/80 mt-2 font-medium">High & medium risk total value</div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-sm font-medium">AI Retention Accuracy</span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-400">{(summary.accuracy * 100).toFixed(1)}%</div>
            <div className="text-xs text-emerald-400/80 mt-2 font-medium">Reliability: High ({(summary.f1_score * 100).toFixed(0)}%)</div>
          </div>
        </div>
      )}

      {/* Model Insights Box */}
      {summary?.insights && summary.insights.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/40 border border-indigo-500/20 p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-indigo-400" /> Actionable Retention Strategy & Insights
          </h3>
          <ul className="space-y-1.5 text-sm text-slate-300">
            {summary.insights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Customer Risk List Table */}
      <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search at-risk customer ID or strategy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Risk Tier:</span>
            {['all', 'high_risk', 'medium_risk', 'low_risk'].map((tier) => (
              <button
                key={tier}
                onClick={() => setFilterRisk(tier)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterRisk === tier
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {tier.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Risk Tier</th>
                <th className="py-3 px-4">Churn Prob.</th>
                <th className="py-3 px-4">Inactivity</th>
                <th className="py-3 px-4">Total Value</th>
                <th className="py-3 px-4">Retention Strategy</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading AI Churn Predictions...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No customers match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.customer_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-white">
                      {cust.external_customer_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        cust.risk_level === 'High Risk'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : cust.risk_level === 'Medium Risk'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {cust.risk_level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {(cust.churn_probability * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {cust.inactivity_days} days ago
                    </td>
                    <td className="py-3.5 px-4 font-medium text-emerald-400">
                      ₹{Number(cust.total_revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300 max-w-xs truncate">
                      {cust.retention_recommendation}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleAction(cust, 'Discount Offer')}
                        className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors"
                        title="Send Offer"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAction(cust, 'Outreach Call')}
                        className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                        title="Executive Outreach"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
