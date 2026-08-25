import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProfileAvatar } from './ProfileAvatar';
import {
  LayoutDashboard,
  ShoppingBag,
  PackageCheck,
  Users,
  Activity,
  ClipboardCheck,
  BarChart3,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ReceiptText,
  UserMinus,
  ShieldAlert,
  Cpu
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  const { currentRole, access, profile, logout } = useAuth();

  const allowedModules = new Set((access?.modules || []).map((module) => module.code));
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    ...(allowedModules.has('sales') ? [{ id: 'sales', label: 'Sales Deals', icon: ShoppingBag, badge: null }] : []),
    ...(allowedModules.has('invoices') || ['sales', 'owner', 'manager', 'admin'].includes(currentRole.id)
      ? [{ id: 'invoices', label: 'Invoices & Billing', icon: ReceiptText, badge: null }]
      : []),
    ...(allowedModules.has('inventory') ? [{ id: 'inventory', label: 'Inventory', icon: PackageCheck, badge: currentRole.id === 'manager' ? 'Stock Alerts' : null, badgeColor: 'bg-rose-500 text-white' }] : []),
    ...(allowedModules.has('customer_segments') ? [{ id: 'customers', label: 'Customers', icon: Users, badge: null }] : []),
    ...(allowedModules.has('churn') || ['owner', 'manager', 'admin'].includes(currentRole.id)
      ? [{ id: 'churn', label: 'Churn Intelligence', icon: UserMinus, badge: 'AI Risk', badgeColor: 'bg-rose-500/20 text-rose-300' }]
      : []),
    ...(allowedModules.has('anomalies') || ['owner', 'manager', 'admin'].includes(currentRole.id)
      ? [{ id: 'anomalies', label: 'Anomaly Alerts', icon: ShieldAlert, badge: 'Realtime', badgeColor: 'bg-amber-500/20 text-amber-300' }]
      : []),
    ...(allowedModules.has('business_setup') ? [{ id: 'setup', label: 'Business Setup', icon: ClipboardCheck, badge: 'Start', badgeColor: 'bg-amber-500/15 text-amber-300' }] : []),
    ...(allowedModules.has('team_management') ? [{ id: 'team', label: 'Team & Performance', icon: Users, badge: 'Owner', badgeColor: 'bg-indigo-500/20 text-indigo-300' }] : []),
    ...(allowedModules.has('team_performance') ? [{ id: 'team', label: currentRole.id === 'sales' ? 'My Performance' : 'Team Performance', icon: Activity, badge: currentRole.id === 'manager' ? 'Store' : 'Personal', badgeColor: 'bg-emerald-500/15 text-emerald-300' }] : []),
    ...(allowedModules.has('forecasts') ? [{ id: 'reports', label: 'Reports & Forecasts', icon: BarChart3, badge: 'Live', badgeColor: 'bg-emerald-500/15 text-emerald-300' }] : []),
    ...(allowedModules.has('ai_config') || currentRole.id === 'admin'
      ? [{ id: 'ai_config', label: 'AI Management', icon: Cpu, badge: 'Admin', badgeColor: 'bg-indigo-500/20 text-indigo-300' }]
      : []),
    { id: 'settings', label: 'Settings', icon: Settings, badge: null }
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header & Brand Logo */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="text-base font-bold text-white tracking-tight truncate">MarketMind AI</h1>
                <p className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Enterprise v2.4</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Current Active Role Switcher Card */}
        {!isCollapsed && (
          <div className="m-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Workspace View</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentRole.badgeColor}`}>
                {currentRole.badge}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ProfileAvatar profile={profile} fallbackImage={currentRole.avatar} className="w-8 h-8 rounded-full border border-indigo-400/30 text-base" />
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{profile?.full_name || currentRole.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Info & Logout */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {!isCollapsed ? (
          <div className="space-y-2">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Session</span>
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full p-2.5 flex items-center justify-center text-rose-400 hover:bg-rose-500/10 rounded-xl"
            title="Sign Out Session"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
};
