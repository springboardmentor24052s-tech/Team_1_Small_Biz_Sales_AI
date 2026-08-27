import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { CardSkeleton, Skeleton } from '../ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { MOCK_CUSTOMERS, MOCK_MANAGER_DATA } from '../../data/mockData';
import recommendationService from '../../services/recommendationService';
import {
  Sparkles,
  ShoppingBag,
  Zap,
  DollarSign,
  Layers,
  Search,
  RefreshCw,
  Plus,
  Check,
  PackageCheck,
  Building2,
  Filter,
  ArrowUpRight,
  Target,
  Shield,
  Activity,
  Award,
  AlertTriangle,
  TrendingUp,
  Users,
  ArrowRight,
  BarChart2,
  SortAsc,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBadgeVariantForType(type) {
  if (!type) return 'neutral';
  const t = type.toLowerCase();
  if (t.includes('cross')) return 'info';
  if (t.includes('upsell')) return 'warning';
  if (t.includes('personaliz') || t.includes('smart')) return 'success';
  return 'neutral';
}

function ScoreBar({ score }) {
  const pct = Math.min(100, Math.max(0, score || 0));
  const color =
    pct >= 85
      ? 'from-emerald-500 to-teal-400'
      : pct >= 70
      ? 'from-indigo-500 to-emerald-400'
      : 'from-amber-500 to-orange-400';
  return (
    <div className="w-full h-1.5 rounded-full bg-indigo-200 dark:bg-indigo-900/60 overflow-hidden">
      <div
        className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function CrossSellSection({ items }) {
  const crossSellItems = items.filter(
    (r) => r.recommendation_type?.toLowerCase().includes('cross') || r.association_confidence >= 0.7
  );
  if (!crossSellItems.length) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <ArrowRight className="w-4 h-4 text-indigo-500" />
        Cross-Sell Opportunities
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {crossSellItems.slice(0, 6).map((rec) => (
          <Card key={`cs-${rec.id}`} hoverEffect className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-slate-400">{rec.sku}</span>
                  <Badge variant="info" size="sm">Cross-Sell</Badge>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {rec.product_name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Category: <strong className="text-slate-700 dark:text-slate-300">{rec.category}</strong>
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  ${typeof rec.unit_price === 'number' ? rec.unit_price.toFixed(2) : rec.unit_price}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Confidence: {rec.association_confidence
                    ? `${Math.round(rec.association_confidence * 100)}%`
                    : '--'}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <ScoreBar score={rec.match_score} />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                {rec.reasoning}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function UpsellSection({ items }) {
  const upsellItems = items.filter(
    (r) => r.recommendation_type?.toLowerCase().includes('upsell') || r.unit_price >= 200
  );
  if (!upsellItems.length) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-amber-500" />
        Upsell Opportunities
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {upsellItems.slice(0, 6).map((rec) => (
          <Card key={`up-${rec.id}`} hoverEffect className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-slate-400">{rec.sku}</span>
                  <Badge variant="warning" size="sm">Upsell</Badge>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {rec.product_name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Category: <strong className="text-slate-700 dark:text-slate-300">{rec.category}</strong>
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  ${typeof rec.unit_price === 'number' ? rec.unit_price.toFixed(2) : rec.unit_price}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Score: {rec.match_score ? `${rec.match_score}%` : '--'}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <ScoreBar score={rec.match_score} />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                {rec.reasoning}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function InsightsSection({ insights }) {
  if (!insights || !insights.length) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-500" />
        Recommendation Insights
      </h2>
      <Card>
        <ul className="space-y-3">
          {insights.map((insight, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40"
            >
              <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <span className="text-[10px] font-bold">{idx + 1}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{insight}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function EvalMetricsSection({ evaluation }) {
  if (!evaluation) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-purple-500" />
        Model Evaluation Metrics
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverEffect>
          <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">
            Precision @ {evaluation.k}
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {evaluation.precision_at_k != null
              ? `${(evaluation.precision_at_k * 100).toFixed(1)}%`
              : '--'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Relevant recommendations ratio
          </p>
        </Card>
        <Card hoverEffect>
          <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">
            Recall @ {evaluation.k}
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {evaluation.recall_at_k != null
              ? `${(evaluation.recall_at_k * 100).toFixed(1)}%`
              : '--'}
          </div>
          <p className="text-xs text-emerald-500 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Signal retrieval coverage
          </p>
        </Card>
        <Card hoverEffect>
          <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">
            F1-Score @ {evaluation.k}
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {evaluation.f1_score_at_k != null ? evaluation.f1_score_at_k.toFixed(3) : '--'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Harmonic accuracy score</p>
        </Card>
      </div>
      <div className="text-xs text-slate-400 dark:text-slate-500 text-right">
        Evaluated over {evaluation.total_evaluated_queries ?? '--'} queries
      </div>
    </div>
  );
}

// ─── Role-Specific KPI Cards ──────────────────────────────────────────────────

function OwnerKPIs({ recommendations, analytics }) {
  return (
    <>
      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Recommended Products</span>
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {recommendations.length > 0 ? `${recommendations.length} Products` : '--'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active recommendation matches</p>
        </div>
      </Card>

      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Revenue Potential</span>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {analytics
              ? `$${analytics.potential_revenue_boost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '--'}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-emerald-500 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Estimated uplift</span>
          </div>
        </div>
      </Card>

      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Top Category</span>
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
            {analytics ? analytics.top_recommended_category : '--'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Highest cross-sell signal</p>
        </div>
      </Card>

      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Recommendation Score</span>
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {analytics ? `${analytics.avg_match_score}%` : '--'}
          </h3>
          <div className="mt-1">
            <Badge variant={analytics ? 'success' : 'neutral'} size="sm">
              {analytics ? 'Model Active' : 'Awaiting Data'}
            </Badge>
          </div>
        </div>
      </Card>
    </>
  );
}

function ManagerKPIs({ recommendations, analytics }) {
  const lowStockCount = recommendations.filter((r) => r.stock_status === 'Low Stock' || r.stock_status === 'Critical Stock').length;
  return (
    <>
      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Inventory Items</span>
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {recommendations.length > 0 ? `${recommendations.length} SKUs` : '--'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Evaluated store catalog</p>
        </div>
      </Card>

      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Low Stock Items</span>
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {recommendations.length > 0 ? (lowStockCount > 0 ? `${lowStockCount} Items` : '0 Items') : '--'}
          </h3>
          <p className="text-xs text-rose-500 font-medium mt-1">
            {lowStockCount > 0 ? 'Action Recommended' : 'All levels nominal'}
          </p>
        </div>
      </Card>

      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Top Category</span>
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
            {analytics ? analytics.top_recommended_category : '--'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Highest stock turnover</p>
        </div>
      </Card>

      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Avg Match Score</span>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {analytics ? `${analytics.avg_match_score}%` : '--'}
          </h3>
          <div className="mt-1">
            <Badge variant={analytics ? 'success' : 'neutral'} size="sm">
              {analytics ? 'Engine Active' : 'Awaiting Data'}
            </Badge>
          </div>
        </div>
      </Card>
    </>
  );
}

function SalesKPIs({ recommendations, analytics }) {
  const topRec = recommendations.length > 0 ? recommendations[0] : null;
  return (
    <>
      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Recommended Products</span>
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Target className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {recommendations.length > 0 ? `${recommendations.length} Products` : '--'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">High conversion opportunities</p>
        </div>
      </Card>

      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Revenue Potential</span>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {analytics
              ? `$${analytics.potential_revenue_boost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '--'}
          </h3>
          <p className="text-xs text-emerald-500 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Estimated pipeline uplift
          </p>
        </div>
      </Card>

      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Best Pitch Product</span>
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {topRec ? topRec.product_name : '--'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {topRec ? `Score: ${topRec.match_score}%` : 'Awaiting data'}
          </p>
        </div>
      </Card>

      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Avg Confidence</span>
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {analytics ? `${analytics.avg_match_score}%` : '--'}
          </h3>
          <div className="mt-1">
            <Badge variant={analytics ? 'success' : 'neutral'} size="sm">
              {analytics ? 'High Confidence' : 'Awaiting Data'}
            </Badge>
          </div>
        </div>
      </Card>
    </>
  );
}

function AdminKPIs({ analytics, evaluation }) {
  return (
    <>
      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Precision @ 5</span>
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Award className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {evaluation ? `${(evaluation.precision_at_k * 100).toFixed(1)}%` : '--'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Relevant recommendations ratio</p>
        </div>
      </Card>

      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Recall @ 5</span>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {evaluation ? `${(evaluation.recall_at_k * 100).toFixed(1)}%` : '--'}
          </h3>
          <p className="text-xs text-emerald-500 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Signal retrieval
          </p>
        </div>
      </Card>

      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">F1 Score</span>
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {evaluation ? evaluation.f1_score_at_k.toFixed(3) : '--'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Harmonic accuracy</p>
        </div>
      </Card>

      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Active Signals</span>
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Shield className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {analytics ? `${analytics.active_signals_count}` : '--'}
          </h3>
          <div className="mt-1">
            <Badge variant={analytics ? 'success' : 'neutral'} size="sm">
              {analytics ? 'System Operational' : 'Awaiting Data'}
            </Badge>
          </div>
        </div>
      </Card>
    </>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────

function RecCard({ rec, userRole, onAddToQuote }) {
  return (
    <Card hoverEffect className="flex flex-col justify-between border-slate-200/80 dark:border-slate-800">
      <div className="space-y-3">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] font-mono font-bold text-slate-400 tracking-wider">{rec.sku}</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={getBadgeVariantForType(rec.recommendation_type)} size="sm">
              {rec.recommendation_type}
            </Badge>
            <Badge variant={rec.stock_status === 'In Stock' ? 'success' : 'warning'} size="sm">
              {rec.stock_status}
            </Badge>
          </div>
        </div>

        {/* Product Title & Category */}
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{rec.product_name}</h3>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>
              Category: <strong className="text-slate-700 dark:text-slate-300">{rec.category}</strong>
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
              ${typeof rec.unit_price === 'number' ? rec.unit_price.toFixed(2) : rec.unit_price}
            </span>
          </div>
        </div>

        {/* Match Score */}
        <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60">
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Match Score</span>
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">{rec.match_score}%</span>
          </div>
          <ScoreBar score={rec.match_score} />
        </div>

        {/* Manager: show stock */}
        {userRole === 'manager' && (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>Available Stock:</span>
            <strong
              className={
                rec.stock < 5
                  ? 'text-rose-600 dark:text-rose-400'
                  : rec.stock < 15
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }
            >
              {rec.stock} units
            </strong>
          </div>
        )}

        {/* Reasoning */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Reason</span>
          <p className="leading-relaxed line-clamp-3">{rec.reasoning}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400">
          Est: <strong className="text-emerald-500 font-bold">{rec.potential_revenue}</strong>
        </span>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => onAddToQuote(rec)}>
          Add to Deal
        </Button>
      </div>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const ProductRecommendationsModule = () => {
  const { addToast } = useToast();
  const { currentRole } = useAuth();
  const userRole = currentRole?.id || 'owner';

  // ── Core data state
  const [recommendations, setRecommendations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [insights, setInsights] = useState([]);

  // ── UI state
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null); // null | string
  const [refreshing, setRefreshing] = useState(false);

  // ── Filter state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSku, setSelectedSku] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score');

  // ── Dropdown options from live API (with mock fallback)
  const [customerOptions, setCustomerOptions] = useState(MOCK_CUSTOMERS);
  const [productOptions, setProductOptions] = useState(MOCK_MANAGER_DATA.inventoryItems);

  // ── Modal state
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedRecItem, setSelectedRecItem] = useState(null);
  const [quoteQty, setQuoteQty] = useState('1');
  const [quoteStage, setQuoteStage] = useState('Proposal Sent');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Prevent infinite loop: only re-fetch when filter values change, not on every render.
  // We use a ref to hold the stable fetch function so addToast doesn't cause re-registration.
  const addToastRef = useRef(addToast);
  useEffect(() => { addToastRef.current = addToast; }, [addToast]);

  // Load dropdown options once on mount (from live API, fall back gracefully)
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [custRes, prodRes] = await Promise.allSettled([
          recommendationService.getCustomers(),
          recommendationService.getProducts(),
        ]);
        if (custRes.status === 'fulfilled' && custRes.value?.items?.length) {
          setCustomerOptions(custRes.value.items);
        }
        if (prodRes.status === 'fulfilled' && prodRes.value?.items?.length) {
          setProductOptions(prodRes.value.items);
        }
      } catch {
        // Silently fall back to mock data — already set as default state
      }
    };
    loadOptions();
  }, []);

  // Core fetch: called on mount and when any filter changes
  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setApiError(null);

    const params = { role: userRole };
    if (selectedCustomerId) params.customer_id = selectedCustomerId;
    if (selectedSku) params.sku = selectedSku;
    if (selectedCategory) params.category = selectedCategory;
    if (selectedStrategy && selectedStrategy !== 'all') params.strategy = selectedStrategy;

    try {
      const [recData, analyticsData, evalData, insightsData] = await Promise.allSettled([
        recommendationService.getRecommendations(params),
        recommendationService.getAnalytics(),
        recommendationService.getEvaluation(5),
        recommendationService.getInsights(),
      ]);

      if (recData.status === 'fulfilled' && recData.value?.recommendations) {
        setRecommendations(recData.value.recommendations);
      } else {
        setRecommendations([]);
        // Only set error if recommendations itself failed (the critical call)
        if (recData.status === 'rejected') {
          setApiError('Recommendation data is temporarily unavailable. Please try again.');
        }
      }

      if (analyticsData.status === 'fulfilled') setAnalytics(analyticsData.value);
      if (evalData.status === 'fulfilled') setEvaluation(evalData.value);
      if (insightsData.status === 'fulfilled') setInsights(insightsData.value?.insights || []);

      if (isManualRefresh) {
        addToastRef.current('Recommendations refreshed.', 'success');
      }
    } catch (_err) {
      setRecommendations([]);
      setApiError('Recommendation data is temporarily unavailable. Please try again.');
      if (isManualRefresh) {
        addToastRef.current('Could not connect to the recommendation engine.', 'warning');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, selectedCustomerId, selectedSku, selectedCategory, selectedStrategy]);

  // Run fetch whenever filters change (deps are stable primitives — no infinite loop)
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // ── Client-side search + sort
  const filteredItems = React.useMemo(() => {
    let items = [...recommendations];

    // Keyword filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(
        (item) =>
          item.product_name?.toLowerCase().includes(term) ||
          item.sku?.toLowerCase().includes(term) ||
          item.category?.toLowerCase().includes(term)
      );
    }

    // Sort
    items.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.match_score || 0) - (a.match_score || 0);
        case 'name':
          return (a.product_name || '').localeCompare(b.product_name || '');
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'type':
          return (a.recommendation_type || '').localeCompare(b.recommendation_type || '');
        default:
          return 0;
      }
    });

    return items;
  }, [recommendations, searchTerm, sortBy]);

  // ── Handlers
  const handleOpenQuoteModal = (item) => {
    setSelectedRecItem(item);
    setQuoteQty('1');
    setIsQuoteModalOpen(true);
  };

  const handleQuoteSubmit = (e) => {
    e.preventDefault();
    if (!selectedRecItem) return;
    setSubmittingQuote(true);
    setTimeout(() => {
      setSubmittingQuote(false);
      setIsQuoteModalOpen(false);
      addToastRef.current(`Added ${quoteQty}× "${selectedRecItem.product_name}" to sales pipeline.`, 'success');
    }, 600);
  };

  const resetFilters = () => {
    setSelectedCustomerId('');
    setSelectedSku('');
    setSelectedCategory('');
    setSelectedStrategy('all');
    setSearchTerm('');
    setSortBy('score');
  };

  // ── Role header config
  const roleHeader = {
    owner: {
      badge: 'AI Revenue Intelligence',
      description: 'Business-wide cross-sell and upsell opportunities based on customer and sales data.',
    },
    manager: {
      badge: 'Store Recommendations',
      description: 'Store-level product recommendations, frequently bought together, and inventory signals.',
    },
    sales: {
      badge: 'Customer Selling Guide',
      description: 'Customer-oriented product recommendations and cross-sell opportunities for active accounts.',
    },
    admin: {
      badge: 'System Monitoring',
      description: 'System-wide recommendation activity and model accuracy metrics.',
    },
  }[userRole] || {
    badge: 'AI Recommendations',
    description: 'Smart product recommendations based on customer and sales behavior.',
  };

  const strategyOptions = [
    { id: 'all', label: 'All Types' },
    { id: 'cross_sell', label: 'Cross-Sell' },
    { id: 'upsell', label: 'Upsell' },
    { id: 'high_margin', label: 'High Margin' },
    { id: 'inventory_clearance', label: 'Inventory Clear.' },
  ];

  const categories = [...new Set([
    'Terminals', 'Supplies', 'Hardware', 'Networking', 'Software Licenses',
    ...productOptions.map((p) => p.category).filter(Boolean),
  ])];

  // ── Render loading skeleton
  const renderSkeleton = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </>
  );

  // ── Render error state
  const renderError = () => (
    <Card className="text-center py-14">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Recommendations Unavailable
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{apiError}</p>
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => fetchData(true)} isLoading={refreshing}>
          Retry
        </Button>
      </div>
    </Card>
  );

  // ── Render empty state
  const renderEmpty = () => (
    <Card className="text-center py-14">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          No Recommendations Available
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {searchTerm || selectedCategory || selectedStrategy !== 'all' || selectedCustomerId || selectedSku
            ? 'No recommendations available for the selected filters.'
            : 'Recommendations are temporarily unavailable. Please try again.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Reset Filters
          </Button>
          <Button variant="primary" size="sm" icon={RefreshCw} onClick={() => fetchData(true)} isLoading={refreshing}>
            Retry
          </Button>
        </div>
      </div>
    </Card>
  );

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-xl border border-indigo-800/40">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{roleHeader.badge}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AI Recommendation</h1>
          <p className="text-sm text-indigo-200">{roleHeader.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="glass"
            size="sm"
            onClick={() => fetchData(true)}
            isLoading={refreshing}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main content: loading, error, or data */}
      {loading ? (
        renderSkeleton()
      ) : apiError && recommendations.length === 0 ? (
        <>
          {/* Still show KPI skeletons with -- placeholders when DB is down */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} hoverEffect>
                <div className="flex items-center justify-between">
                  <Skeleton width="w-24" height="h-3" />
                  <Skeleton width="w-9" height="h-9" rounded="rounded-xl" />
                </div>
                <div className="mt-3 space-y-2">
                  <Skeleton width="w-16" height="h-7" />
                  <Skeleton width="w-28" height="h-3" />
                </div>
              </Card>
            ))}
          </div>
          {renderError()}
        </>
      ) : (
        <>
          {/* KPI Cards — role-specific, no fake data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {userRole === 'owner' && (
              <OwnerKPIs recommendations={recommendations} analytics={analytics} evaluation={evaluation} />
            )}
            {userRole === 'manager' && (
              <ManagerKPIs recommendations={recommendations} analytics={analytics} />
            )}
            {userRole === 'sales' && (
              <SalesKPIs recommendations={recommendations} analytics={analytics} />
            )}
            {userRole === 'admin' && (
              <AdminKPIs analytics={analytics} evaluation={evaluation} />
            )}
          </div>

          {/* Filters & Controls */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-500" />
                  <span>Filters &amp; Controls</span>
                </CardTitle>
                <CardDescription>Filter recommendations by customer, product, category, or type</CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Customer Selector — shown for all roles; mandatory for sales */}
              <div>
                <label htmlFor="customerSelect" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Customer Account
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    id="customerSelect"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="">All Accounts</option>
                    {customerOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.tier ? `(${c.tier})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product/SKU Selector */}
              <div>
                <label htmlFor="skuSelect" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Base Product
                </label>
                <div className="relative">
                  <PackageCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    id="skuSelect"
                    value={selectedSku}
                    onChange={(e) => setSelectedSku(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="">All Products</option>
                    {productOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.id} – {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label htmlFor="categorySelect" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    id="categorySelect"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Keyword Search */}
              <div>
                <label htmlFor="recSearch" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Search
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="recSearch"
                    type="text"
                    placeholder="Product name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>
            </div>

            {/* Type filter + sort row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Type:</span>
                {strategyOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedStrategy(opt.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      selectedStrategy === opt.id
                        ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <SortAsc className="w-4 h-4 text-slate-400" />
                <label htmlFor="sortSelect" className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Sort by:
                </label>
                <select
                  id="sortSelect"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="score">Match Score</option>
                  <option value="name">Product Name</option>
                  <option value="category">Category</option>
                  <option value="type">Recommendation Type</option>
                </select>
              </div>
            </div>
          </Card>

          {/* ── Sales Executive: Personalized Customer section ── */}
          {userRole === 'sales' && selectedCustomerId && (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    Personalized Recommendations
                  </CardTitle>
                  <CardDescription>
                    Products recommended specifically for{' '}
                    {customerOptions.find((c) => c.id === selectedCustomerId)?.name || selectedCustomerId}
                  </CardDescription>
                </div>
                <Badge variant="info">
                  {customerOptions.find((c) => c.id === selectedCustomerId)?.tier || 'Customer'}
                </Badge>
              </CardHeader>
              {filteredItems.length > 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {filteredItems.length} recommendations tailored to this customer based on purchase history and account tier.
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No personalized recommendations found for this customer with current filters.
                </p>
              )}
            </Card>
          )}

          {/* Main Recommendation Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Recommendation Results
              </h2>
              <Badge variant="neutral">{filteredItems.length} match{filteredItems.length !== 1 ? 'es' : ''}</Badge>
            </div>

            {filteredItems.length === 0 ? (
              renderEmpty()
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredItems.map((rec) => (
                  <RecCard
                    key={rec.id}
                    rec={rec}
                    userRole={userRole}
                    onAddToQuote={handleOpenQuoteModal}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Role-specific extra sections ── */}

          {/* Business Owner: Cross-Sell + Upsell + Insights */}
          {userRole === 'owner' && filteredItems.length > 0 && (
            <>
              <CrossSellSection items={filteredItems} />
              <UpsellSection items={filteredItems} />
              <InsightsSection insights={insights} />
            </>
          )}

          {/* Store Manager: Frequently Bought Together (cross-sell) + Insights */}
          {userRole === 'manager' && filteredItems.length > 0 && (
            <>
              <div className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-500" />
                  Frequently Bought Together
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredItems
                    .filter((r) => r.association_confidence >= 0.65)
                    .slice(0, 4)
                    .map((rec) => (
                      <Card key={`fbt-${rec.id}`} hoverEffect className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60">
                            <PackageCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {rec.product_name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {rec.category} · Stock: {rec.stock} · Confidence:{' '}
                              {rec.association_confidence
                                ? `${Math.round(rec.association_confidence * 100)}%`
                                : '--'}
                            </p>
                          </div>
                          <Badge
                            variant={rec.stock_status === 'In Stock' ? 'success' : 'warning'}
                            size="sm"
                            className="shrink-0"
                          >
                            {rec.stock_status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
              <InsightsSection insights={insights} />
            </>
          )}

          {/* Sales Executive: Cross-Sell + Upsell */}
          {userRole === 'sales' && filteredItems.length > 0 && (
            <>
              <CrossSellSection items={filteredItems} />
              <UpsellSection items={filteredItems} />
            </>
          )}

          {/* System Administrator: Evaluation Metrics + Insights */}
          {userRole === 'admin' && (
            <>
              <EvalMetricsSection evaluation={evaluation} />
              <InsightsSection insights={insights} />
            </>
          )}
        </>
      )}

      {/* Quote / Add-to-Deal Modal */}
      <Modal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        title="Add to Sales Pipeline"
        maxWidth="max-w-md"
      >
        {selectedRecItem && (
          <form onSubmit={handleQuoteSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Selected Product</span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {selectedRecItem.product_name} ({selectedRecItem.sku})
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>Unit Price: ${selectedRecItem.unit_price}</span>
                <Badge variant="success">{selectedRecItem.match_score}% Match</Badge>
              </div>
            </div>

            <Input
              id="quoteQtyInput"
              label="Order Quantity"
              type="number"
              min="1"
              max={selectedRecItem.stock || 100}
              value={quoteQty}
              onChange={(e) => setQuoteQty(e.target.value)}
            />

            <div>
              <label htmlFor="stageSelect" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Deal Stage
              </label>
              <select
                id="stageSelect"
                value={quoteStage}
                onChange={(e) => setQuoteStage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="New Prospect">New Prospect</option>
                <option value="Demo Scheduled">Demo Scheduled</option>
                <option value="Proposal Sent">Proposal Sent</option>
                <option value="Closing Stage">Closing Stage</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsQuoteModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={submittingQuote} icon={Check}>
                Confirm Add to Deal
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
