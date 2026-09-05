import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('Admin Dashboard Platform Operations & Governance', () => {
  it('renders platform governance header, counters, and Business Owners directory', () => {
    renderAdminDashboard();

    expect(screen.getByText('Platform Governance & AI Operations')).toBeInTheDocument();
    expect(screen.getByText('RESTRICTED SYSTEM ROOT • PLATFORM ADMIN CONSOLE')).toBeInTheDocument();

    // Business Owners & Teams tab by default
    expect(screen.getByText('Aravali Retail Group')).toBeInTheDocument();
    expect(screen.getByText('Northwind Enterprises')).toBeInTheDocument();

    // Verify employees under default expanded business
    expect(screen.getByText('Vikram Mehta')).toBeInTheDocument();
    expect(screen.getByText('Priya Verma')).toBeInTheDocument();
  });

  it('navigates to Authentication & Login Timings with Business filter', () => {
    renderAdminDashboard();

    const authTab = screen.getByText('Authentication & Login Timings');
    fireEvent.click(authTab);

    expect(screen.getByText('Timestamp & Date')).toBeInTheDocument();
    expect(screen.getByText('Actor Email')).toBeInTheDocument();
    expect(screen.getByText('Business Workspace')).toBeInTheDocument();
  });

  it('navigates to AI Models & Retrain Schedules and displays last trained dates', () => {
    renderAdminDashboard();

    const aiTab = screen.getByText('AI Models & Retrain Schedules');
    fireEvent.click(aiTab);

    expect(screen.getByText('AI Inference Engines & Training Schedules')).toBeInTheDocument();
    expect(screen.getAllByText('Sales & Revenue Demand Forecasting').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Customer RFM Segmentation').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Last Trained:').length).toBeGreaterThanOrEqual(1);
  });
});
