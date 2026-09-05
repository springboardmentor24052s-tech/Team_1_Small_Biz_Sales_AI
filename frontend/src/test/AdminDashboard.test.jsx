import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminDashboard } from '../components/dashboards/AdminDashboard';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider } from '../context/ThemeContext';

const renderAdminDashboard = () => {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AdminDashboard />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

describe('Admin Dashboard Platform Command Center', () => {
  it('renders platform gauges, AI telemetry cards, and tabs correctly', async () => {
    renderAdminDashboard();

    expect(screen.getByText('Platform & AI Operations Center')).toBeInTheDocument();
    expect(screen.getByText('RESTRICTED SYSTEM ROOT • DEVELOPER CONSOLE')).toBeInTheDocument();
    expect(screen.getByText('ONLINE')).toBeInTheDocument();
    expect(screen.getByText('Resend API')).toBeInTheDocument();
    expect(screen.getByText('5 / 5 Operational')).toBeInTheDocument();

    // Verify AI Engine telemetry cards are visible
    expect(screen.getByText('Sales & Revenue Forecasting')).toBeInTheDocument();
    expect(screen.getByText('Customer Segmentation')).toBeInTheDocument();
    expect(screen.getByText('Product Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Customer Churn Predictor')).toBeInTheDocument();
    expect(screen.getByText('Anomaly Detection Engine')).toBeInTheDocument();

    // Verify Tab buttons
    expect(screen.getByText('Security Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('Database & System Inspector')).toBeInTheDocument();
    expect(screen.getByText('RBAC Policy Explorer')).toBeInTheDocument();
  });

  it('switches between tabs and filters correctly', async () => {
    renderAdminDashboard();

    // Switch to Database & System Inspector
    const systemTab = screen.getByText('Database & System Inspector');
    fireEvent.click(systemTab);

    expect(screen.getByText('Database Architecture')).toBeInTheDocument();
    expect(screen.getByText('Multi-Tenant Workspaces Directory')).toBeInTheDocument();

    // Switch to RBAC Policy Explorer
    const rbacTab = screen.getByText('RBAC Policy Explorer');
    fireEvent.click(rbacTab);

    expect(screen.getByText('Role-Based Access Control (RBAC) Explorer')).toBeInTheDocument();
  });
});
