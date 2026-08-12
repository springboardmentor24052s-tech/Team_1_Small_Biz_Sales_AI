import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { DataProvider } from './context/DataContext';

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

const MainAppContent = () => {
  const { isAuthenticated, isInitializing, currentRole } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    setActiveTab('dashboard');
  }, [currentRole.id]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 text-indigo-300 flex items-center justify-center font-semibold">
        Connecting to MarketMind...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Render role-specific dashboard when activeTab is 'dashboard'
  const renderDashboardView = () => {
    switch (currentRole.id) {
      case 'owner':
        return <OwnerDashboard onNavigate={setActiveTab} />;
      case 'manager':
        return <ManagerDashboard />;
      case 'sales':
        return <SalesDashboard onNavigate={setActiveTab} />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <OwnerDashboard onNavigate={setActiveTab} />;
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
        onNavigate={setActiveTab}
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
          <DataProvider>
            <MainAppContent />
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
