import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { ProfileAvatar } from './ProfileAvatar';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
  LogOut
} from 'lucide-react';

export const Navbar = ({ isCollapsed, onOpenAiModal, onNavigate }) => {
  const { currentRole, userEmail, profile, logout, api } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const { salesTransactions, inventoryItems, customers } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState(new Set());

  const [invoices, setInvoices] = useState([]);
  const unreadCount = notifications.filter((notification) => !readNotificationIds.has(notification.id)).length;

  useEffect(() => {
    let active = true;
    const loadInvoices = async () => {
      try {
        const res = await api('/invoices?limit=100');
        if (active) setInvoices(res.items || []);
      } catch {
        if (active) setInvoices([]);
      }
    };
    if (userEmail) loadInvoices();
    return () => { active = false; };
  }, [api, userEmail]);

  // Comprehensive, resilient search results calculation
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 1) return [];

    const modulePages = [
      { id: 'mod-invoices', type: 'Navigation', label: 'Invoices & Billing Management', detail: 'Tax invoices, payment recording & status ledger', tab: 'invoices', keywords: 'invoice billing payment gst inv tax due money overdue' },
      { id: 'mod-churn', type: 'Navigation', label: 'Customer Churn Intelligence', detail: 'ML risk meters & retention action recommendations', tab: 'churn', keywords: 'churn retention risk customer predict ai inactive score' },
      { id: 'mod-anomalies', type: 'Navigation', label: 'Anomaly Alerts Center', detail: 'Real-time fraud, spike/drop, and shrinkage warnings', tab: 'anomalies', keywords: 'anomaly fraud spike drop shrink warning alert notification risk' },
      { id: 'mod-inventory', type: 'Navigation', label: 'Real-Time Stock Inventory', detail: 'Warehouse stock balances, recount & purchase orders', tab: 'inventory', keywords: 'inventory stock sku warehouse restock product po purchase reorder' },
      { id: 'mod-sales', type: 'Navigation', label: 'Sales Deals & POS Transactions', detail: 'Daily cash/card transactions & cross-sell suggestions', tab: 'sales', keywords: 'sales transaction order deal pos cash revenue counter' },
      { id: 'mod-customers', type: 'Navigation', label: 'Customer Directory 360', detail: 'Customer RFM profiles & personalized offers', tab: 'customers', keywords: 'customer client rfm segment profile purchase loyalty' },
      { id: 'mod-reports', type: 'Navigation', label: 'Business Reports & Forecasts', detail: 'Downloadable CSV summaries & revenue forecasting', tab: 'reports', keywords: 'report forecast export csv excel download summary analytics' },
      { id: 'mod-ai', type: 'Navigation', label: 'Admin AI Configuration', detail: 'ML model hyperparameters & retraining triggers', tab: 'ai_config', keywords: 'ai config admin hyperparameter retrain machine learning algorithm' },
      { id: 'mod-settings', type: 'Navigation', label: 'System Settings & Profile', detail: 'Theme, density, password, and preferences', tab: 'settings', keywords: 'settings profile theme dark password preference account' },
    ];

    const results = [
      ...modulePages.map((page) => ({
        ...page,
        matchText: `${page.label} ${page.detail} ${page.keywords}`.toLowerCase()
      })),
      ...(invoices || []).map((inv) => ({
        id: inv.id || inv.invoice_number,
        type: 'Invoice',
        label: `${inv.invoice_number || 'INV'} • ₹${Number(inv.total_amount || 0).toLocaleString('en-IN')}`,
        detail: `${inv.customer_name || 'Retail Customer'} • Status: ${(inv.status || 'pending').toUpperCase()}`,
        tab: 'invoices',
        matchText: `${inv.invoice_number || ''} ${inv.customer_name || ''} ${inv.seller_name || ''} ${inv.status || ''} ${inv.notes || ''} invoice billing`.toLowerCase()
      })),
      ...(salesTransactions || []).map((transaction) => ({
        id: transaction.id,
        type: 'Transaction',
        label: transaction.external_reference || transaction.id?.slice(0, 8) || 'TXN',
        detail: `${transaction.source_system || 'POS'} • ₹${Number(transaction.total_amount || 0).toLocaleString('en-IN')} • ${transaction.status || 'completed'}`,
        tab: 'sales',
        matchText: `${transaction.external_reference || ''} ${transaction.source_system || ''} ${transaction.status || ''} ${transaction.payment_method || ''} transaction sale`.toLowerCase()
      })),
      ...(inventoryItems || []).map((item) => {
        const prodName = item.product?.name || item.name || 'Product';
        const prodSku = item.product?.sku || item.sku || 'SKU';
        const prodCat = item.product?.category || item.category || 'General';
        const stockQty = item.stock_quantity ?? item.stock ?? 0;
        return {
          id: item.id || prodSku,
          type: 'Inventory',
          label: prodName,
          detail: `${prodSku} • ${stockQty} in stock • ${prodCat}`,
          tab: 'inventory',
          matchText: `${prodName} ${prodSku} ${prodCat} stock inventory product`.toLowerCase()
        };
      }),
      ...(customers || []).map((customer) => {
        const custId = customer.external_customer_id || customer.id?.slice(0, 8) || 'CUST';
        return {
          id: customer.id || custId,
          type: 'Customer',
          label: `Customer ${custId}`,
          detail: `${customer.order_count || 1} orders • ₹${Number(customer.total_revenue || 0).toLocaleString('en-IN')}`,
          tab: 'customers',
          matchText: `${custId} customer client`.toLowerCase()
        };
      })
    ];

    return results
      .filter((result) => result.matchText.includes(query))
      .slice(0, 10);
  }, [searchQuery, invoices, salesTransactions, inventoryItems, customers]);

  useEffect(() => {
    const focusSearch = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  useEffect(() => {
    let active = true;
    const loadNotifications = async () => {
      try {
        const response = await api('/notifications');
        if (active) setNotifications(response.items || []);
      } catch {
        if (active) setNotifications([]);
      }
    };
    loadNotifications();
    const seconds = currentRole.id === 'admin'
      ? Number(profile?.role_preferences?.monitoring_refresh || 60)
      : 60;
    const timer = window.setInterval(loadNotifications, seconds * 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, [api, currentRole.id, profile?.role_preferences]);

  const openSearchResult = (result) => {
    if (onNavigate) onNavigate(result.tab);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleMarkAllRead = () => {
    setReadNotificationIds(new Set(notifications.map((notification) => notification.id)));
    addToast('All notifications marked as read', 'info');
  };

  const openNotification = (notification) => {
    setReadNotificationIds((current) => new Set([...current, notification.id]));
    setIsNotifOpen(false);
    if (onNavigate) onNavigate(notification.destination || 'dashboard');
  };

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all duration-300 flex items-center justify-between px-4 sm:px-6 ${
        isCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Global Search Bar */}
      <div className="flex items-center gap-3 w-72 sm:w-96 lg:w-[420px]">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search modules, invoices, inventory, customers..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onBlur={() => window.setTimeout(() => setIsSearchOpen(false), 200)}
            className="w-full pl-10 pr-12 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
          <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-xs">
            Ctrl K
          </kbd>
          {isSearchOpen && searchQuery.trim().length >= 1 && (
            <div className="absolute left-0 top-11 min-w-[340px] sm:min-w-[420px] w-full max-h-[380px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 z-50 animate-scale-up">
              {searchResults.length ? (
                searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      openSearchResult(result);
                    }}
                    onClick={() => openSearchResult(result)}
                    className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3.5 py-2.5 text-left last:border-0 hover:bg-indigo-50/80 dark:border-slate-800 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{result.label}</p>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{result.detail}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      result.type === 'Invoice'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : result.type === 'Navigation'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        : result.type === 'Inventory'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {result.type}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No records found matching "{searchQuery.trim()}"</p>
                  <p className="mt-1 text-[11px] text-slate-400">Try searching for an invoice ID, product name, customer, or module name.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* AI Assistant Quick Trigger */}
        <button
          onClick={onOpenAiModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all shadow-xs"
        >
          <Sparkles className="w-4 h-4 text-indigo-500 animate-spin-slow" />
          <span className="hidden sm:inline">Ask AI Assistant</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-scale-up">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Live Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length ? notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => openNotification(n)}
                    className={`p-3.5 transition-colors flex items-start gap-3 ${
                      !readNotificationIds.has(n.id) ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    } w-full text-left`}
                  >
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{n.title}</p>
                        <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{n.message}</p>
                    </div>
                  </button>
                )) : <p className="px-4 py-8 text-center text-xs text-slate-500">No enabled alerts need your attention.</p>}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ProfileAvatar profile={profile} fallbackImage={currentRole.avatar} className="w-9 h-9 rounded-full border-2 border-indigo-500 text-lg" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">{profile?.full_name || currentRole.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{currentRole.badge}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-scale-up">
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 mb-2">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Authenticated Session</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
              </div>

              <div className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300">
                <p className="text-xs font-bold">{currentRole.name}</p>
                <p className="text-[11px] mt-1">{currentRole.id === 'admin' ? 'Internal platform access.' : currentRole.id === 'owner' ? 'Business and team owner.' : 'Role and store are managed by your Business Owner.'}</p>
              </div>

              <button
                onClick={() => { onNavigate('settings'); setIsProfileOpen(false); }}
                className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Profile & Settings
              </button>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
