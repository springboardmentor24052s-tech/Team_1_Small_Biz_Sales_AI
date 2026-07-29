import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

import { Login } from './components/auth/Login';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { ToastContainer } from './components/common/ToastContainer';
import { AiAssistantModal } from './components/common/AiAssistantModal';
import { UIComponentLibrary } from './components/common/UIComponentLibrary';

import { OwnerDashboard } from './components/dashboards/OwnerDashboard';
import { ManagerDashboard } from './components/dashboards/ManagerDashboard';
import { SalesDashboard } from './components/dashboards/SalesDashboard';
import { AdminDashboard } from './components/dashboards/AdminDashboard';

import { SalesModule } from './components/modules/SalesModule';
import { InventoryModule } from './components/modules/InventoryModule';
import { CustomersModule } from './components/modules/CustomersModule';
import { ReportsModule } from './components/modules/ReportsModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { Loader2 } from 'lucide-react';

const MainAppContent = () => {
  const { isAuthenticated, currentRole, isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium text-slate-300">Authenticating MarketMind session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Render role-specific dashboard when activeTab is 'dashboard'
  const renderDashboardView = () => {
    switch (currentRole?.id) {
      case 'owner':
        return <OwnerDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'sales':
        return <SalesDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <OwnerDashboard />;
    }
  };

  // Render dynamic main view
  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardView();
      case 'sales':
        return <SalesModule />;
      case 'inventory':
        return <InventoryModule />;
      case 'customers':
        return <CustomersModule />;
      case 'reports':
        return <ReportsModule />;
      case 'components':
        return <UIComponentLibrary />;
      case 'settings':
        return <SettingsModule />;
      default:
        return renderDashboardView();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors duration-300 flex">
      {/* Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Top Header Navbar */}
      <Navbar
        isCollapsed={isCollapsed}
        onOpenAiModal={() => setIsAiModalOpen(true)}
      />

      {/* Dynamic Main Workspace Container */}
      <main
        className={`flex-1 pt-20 pb-12 px-4 sm:px-8 transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          {renderMainContent()}
        </div>
      </main>

      {/* Global Toast Alerts */}
      <ToastContainer />

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
