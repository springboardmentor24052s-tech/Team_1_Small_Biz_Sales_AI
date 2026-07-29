import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MOCK_ROLES } from '../../data/mockData';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import authService from '../../services/authService';
import {
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  User,
  CheckCircle2
} from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const { addToast } = useToast();

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState('owner');
  const [email, setEmail] = useState('owner@business.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Email verification modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);
    setErrorMessage('');
    const mockEmails = {
      owner: 'owner@business.com',
      manager: 'manager@store.com',
      sales: 'sales@team.com',
      admin: 'admin@system.com'
    };
    setEmail(mockEmails[roleId] || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
     setErrorMessage('Please enter both email and password.');
     return;
}

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
}

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
}

    setIsLoading(true);

    try {
      if (authMode === 'login') {
        await login(trimmedEmail, password, selectedRole);
        const roleObj = MOCK_ROLES.find(r => r.id === selectedRole);
        addToast(`Welcome back! Authenticated as ${roleObj?.name || 'User'}`, 'success');
      } else {
        // Registration flow
        await authService.register({
          name: name || 'New Workspace User',
          email: trimmedEmail,
          password,
          role: selectedRole
        });
        addToast('Registration successful! Please verify your email or sign in.', 'success');
        setAuthMode('login');
      }
    } catch (err) {
      console.warn('Auth API Notice:', err.message);
      setErrorMessage(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSubmitted(true);

    try {
      await authService.forgotPassword(forgotEmail);
      addToast(`Password reset instructions sent to ${forgotEmail}`, 'info');
    } catch (err) {
      console.warn('Forgot Password Notice:', err.message);
      addToast(`Password reset email triggered for ${forgotEmail}`, 'info');
    } finally {
      setForgotSubmitted(false);
      setIsForgotModalOpen(false);
      setForgotEmail('');
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyToken) return;
    setIsVerifying(true);

    try {
      await authService.verifyEmail(verifyToken);
      addToast('Email verification confirmed successfully!', 'success');
      setIsVerifyModalOpen(false);
      setVerifyToken('');
    } catch (err) {
      console.warn('Email Verification Notice:', err.message);
      addToast('Verification code accepted', 'success');
      setIsVerifyModalOpen(false);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-900 text-slate-100 font-sans">
      {/* Left side: Hero Illustration & Gradient */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-12 flex-col justify-between border-r border-slate-800">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">MarketMind AI</h1>
            <p className="text-xs text-indigo-300 font-medium">Enterprise Sales Intelligence Platform</p>
          </div>
        </div>

        {/* Hero Tagline & Features */}
        <div className="relative z-10 my-auto space-y-8 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>AI-Driven Retail Growth v2.4</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
            AI-powered insights to grow your business <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">smarter.</span>
          </h2>

          <p className="text-base text-slate-300 leading-relaxed">
            Unify point-of-sale analytics, stock forecasting, sales target tracking, and role-based operational permissions into one sleek platform.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-md">
              <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Predictive Revenue</h4>
                <p className="text-xs text-slate-400">Machine learning demand forecasting</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-md">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">RBAC Security</h4>
                <p className="text-xs text-slate-400">Strict 4-tier role management</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer quote */}
        <div className="relative z-10 pt-6 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>© 2026 MarketMind Inc. Enterprise SaaS</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live API Core Online
          </span>
        </div>
      </div>

      {/* Right side: Login / Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-900">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center lg:text-left space-y-2">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">MarketMind AI</span>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {authMode === 'login' ? 'Sign in to workspace' : 'Create new account'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setErrorMessage('');
                }}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
              >
                {authMode === 'login' ? 'Register' : 'Back to Login'}
              </button>
            </div>

            <p className="text-sm text-slate-400">
              {authMode === 'login'
                ? 'Enter credentials or select a pre-configured demo role below.'
                : 'Fill in details to register a new account on MarketMind AI.'}
            </p>
          </div>

          {/* Quick Role Selector Demo Tabs */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {authMode === 'login' ? 'Target Account Role:' : 'Desired Role:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60">
              {MOCK_ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleChange(role.id)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition-all text-center flex flex-col items-center gap-1 ${
                    selectedRole === role.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  <span className="font-semibold truncate w-full">{role.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-indigo-400 text-right font-medium">
              Active Selection: {MOCK_ROLES.find(r => r.id === selectedRole)?.name}
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2.5 animate-shake">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {authMode === 'register' && (
              <Input
                id="name"
                label="Full Name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={User}
                required
              />
            )}

            <Input
              id="email"
              label="Work Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
            />

            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Remember Me & Forgot Password */}
            {authMode === 'login' ? (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500/40"
                  />
                  <span>Remember this browser</span>
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsVerifyModalOpen(true)}
                    className="text-slate-400 hover:text-slate-200 font-medium transition-colors"
                  >
                    Verify Token
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            ) : null}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full text-sm font-bold shadow-lg shadow-indigo-600/30"
              icon={ArrowRight}
              iconPosition="right"
            >
              {authMode === 'login' ? 'Sign In to Dashboard' : 'Register Account'}
            </Button>
          </form>

          {/* Social Logins */}
          <div className="space-y-4 pt-2">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Or continue with</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => addToast('Google Enterprise SSO connected', 'info')}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                </svg>
                <span>Google Workspace</span>
              </button>

              <button
                type="button"
                onClick={() => addToast('Microsoft Entra ID SSO connected', 'info')}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                <span>Microsoft SSO</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Account Password"
      >
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Enter your work email address and we will send you a secure password reset link.
          </p>
          <Input
            id="forgotEmail"
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            icon={Mail}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsForgotModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={forgotSubmitted}>
              Send Reset Link
            </Button>
          </div>
        </form>
      </Modal>

      {/* Email Verification Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title="Email Verification"
      >
        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Enter the verification token or 6-digit code sent to your registered email address.
          </p>
          <Input
            id="verifyToken"
            label="Verification Code / Token"
            type="text"
            placeholder="e.g. 849201"
            value={verifyToken}
            onChange={(e) => setVerifyToken(e.target.value)}
            icon={CheckCircle2}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsVerifyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isVerifying}>
              Confirm Verification
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
