import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { MOCK_NOTIFICATIONS } from '../../data/mockData';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
  LogOut,
  User,
  Shield,
  X
} from 'lucide-react';

export const Navbar = ({ isCollapsed, onOpenAiModal }) => {
  const { currentRole, userEmail, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    addToast('All notifications marked as read', 'info');
  };

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all duration-300 flex items-center justify-between px-4 sm:px-6 ${
        isCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Global Search Bar */}
      <div className="flex items-center gap-3 w-1/3 min-w-[220px]">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search SKUs, deals, customers, or ask AI... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
          <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-xs">
            ⌘K
          </kbd>
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
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</h4>
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
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 transition-colors flex items-start gap-3 ${
                      n.unread ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{n.title}</p>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{n.message}</p>
                    </div>
                  </div>
                ))}
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
            <img
              src={currentRole.avatar}
              alt={currentRole.name}
              className="w-8 h-8 rounded-full object-cover border-2 border-indigo-500"
            />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">{currentRole.name}</p>
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
                <p className="text-[11px] mt-1">Role changes require an administrator.</p>
              </div>

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
