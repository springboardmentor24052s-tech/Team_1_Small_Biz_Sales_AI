import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Login } from '../components/auth/Login';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider } from '../context/ThemeContext';

const renderLogin = (props = {}) => {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Login {...props} />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

describe('Developer & Secret Admin Access Path', () => {
  it('renders only 3 commercial business roles in standard public login', () => {
    renderLogin({ isDeveloperPortal: false, initialMode: 'login' });

    expect(screen.getByText('Business')).toBeInTheDocument();
    expect(screen.getByText('Store')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();

    // Verify Admin is NOT visible in public demo tabs
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    expect(screen.queryByText('Administrator')).not.toBeInTheDocument();
  });

  it('renders dedicated OTP-only Developer Console without email/password fields', () => {
    const handleBack = vi.fn();
    renderLogin({ isDeveloperPortal: true, initialMode: 'login', onBack: handleBack });

    expect(screen.getByText('Developer Console')).toBeInTheDocument();
    expect(screen.getByText('RESTRICTED DEVELOPER OTP GATEWAY')).toBeInTheDocument();
    expect(screen.getByText('SYS_ROOT')).toBeInTheDocument();
    expect(screen.getByText('Developer / Admin Email')).toBeInTheDocument();
    expect(screen.queryByText('garvit2005k@gmail.com')).not.toBeInTheDocument();
    expect(screen.queryByText('Quick Demo OTP (123456)')).not.toBeInTheDocument();
    expect(screen.getByText('Send OTP')).toBeInTheDocument();
    expect(screen.getByText('Verify OTP & Open Developer Console')).toBeInTheDocument();
    expect(screen.getByText('Return to Public Workspace')).toBeInTheDocument();

    // Verify Email, Password, and Demo role selector are NOT rendered in developer portal
    expect(screen.queryByText('Work Email Address')).not.toBeInTheDocument();
    expect(screen.queryByText('Password')).not.toBeInTheDocument();
    expect(screen.queryByText('Forgot password?')).not.toBeInTheDocument();
    expect(screen.queryByText('Remember this browser')).not.toBeInTheDocument();
    expect(screen.queryByText('Demo Access Role:')).not.toBeInTheDocument();
  });
});
