import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MOCK_ROLES } from '../../data/mockData';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
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
  CheckCircle2,
  User,
  Building2,
  Store,
  ArrowLeft
} from 'lucide-react';

export const Login = ({ initialMode = 'login', onBack }) => {
  const {
    login,
    register,
    verifyEmail,
    acceptInvitation,
    requestPasswordReset,
    confirmPasswordReset
  } = useAuth();
  const { addToast } = useToast();

  const [authMode, setAuthMode] = useState(initialMode);
  const [selectedRole, setSelectedRole] = useState('owner');
  const [email, setEmail] = useState('owner.demo@marketmind.example.com');
  const [password, setPassword] = useState('MarketMindDemo123!');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [isResetRequested, setIsResetRequested] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isInvitationOpen, setIsInvitationOpen] = useState(false);
  const [invitationToken, setInvitationToken] = useState('');
  const [invitationPassword, setInvitationPassword] = useState('');
  const [isAcceptingInvitation, setIsAcceptingInvitation] = useState(false);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const passwordError = (value) => {
    if (value.length < 12) return 'Password must contain at least 12 characters.';
    if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter.';
    if (!/[a-z]/.test(value)) return 'Password must contain a lowercase letter.';
    if (!/\d/.test(value)) return 'Password must contain a number.';
    return '';
  };

  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);
    setErrorMessage('');
    const demoEmails = {
      owner: 'owner.demo@marketmind.example.com',
      manager: 'manager.demo@marketmind.example.com',
      sales: 'sales.demo@marketmind.example.com',
      admin: 'admin.demo@marketmind.example.com'
    };
    setEmail(demoEmails[roleId] || '');
    setMfaCode('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    if (!emailPattern.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    const invalidPassword = passwordError(password);
    if (invalidPassword) {
      setErrorMessage(invalidPassword);
      return;
    }
    if (authMode === 'register' && (!fullName.trim() || !businessName.trim() || !storeName.trim())) {
      setErrorMessage('Enter your name, business name and first store name.');
      return;
    }
    if (authMode === 'login' && selectedRole === 'admin' && !mfaCode) {
      setErrorMessage('Enter the current administrator MFA code.');
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'login') {
        const role = await login({
          email: trimmedEmail,
          password,
          mfaCode,
          rememberMe
        });
        addToast(`Welcome back! Logged in as ${role.name}`, 'success');
      } else {
        const response = await register({
          business_name: businessName.trim(),
          store_name: storeName.trim(),
          full_name: fullName.trim(),
          email: trimmedEmail,
          password,
          currency: 'INR',
          timezone: 'Asia/Kolkata'
        });
        setVerifyToken(response.token || '');
        setIsVerifyModalOpen(true);
        addToast(response.message, 'success');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Unable to complete authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSubmitted(true);
    try {
      if (!isResetRequested) {
        const response = await requestPasswordReset(forgotEmail.trim());
        setResetToken(response.token || '');
        setIsResetRequested(true);
        addToast(response.message, 'info');
      } else {
        if (!resetToken.trim()) throw new Error('Enter the reset token sent to your email.');
        const invalidPassword = passwordError(resetPassword);
        if (invalidPassword) throw new Error(invalidPassword);
        const response = await confirmPasswordReset({
          token: resetToken,
          newPassword: resetPassword
        });
        addToast(response.message, 'success');
        setIsForgotModalOpen(false);
        setForgotEmail('');
        setIsResetRequested(false);
        setResetToken('');
        setResetPassword('');
      }
    } catch (error) {
      addToast(error.message, 'danger');
    } finally {
      setForgotSubmitted(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyToken.trim()) return;
    setIsVerifying(true);
    try {
      const response = await verifyEmail(verifyToken.trim());
      addToast(response.message, 'success');
      setIsVerifyModalOpen(false);
      setAuthMode('login');
      setVerifyToken('');
      setFullName('');
      setBusinessName('');
      setStoreName('');
    } catch (error) {
      addToast(error.message, 'danger');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInvitationSubmit = async (event) => {
    event.preventDefault();
    const invalidPassword = passwordError(invitationPassword);
    if (invalidPassword) {
      addToast(invalidPassword, 'danger');
      return;
    }
    setIsAcceptingInvitation(true);
    try {
      const response = await acceptInvitation({
        token: invitationToken.trim(),
        password: invitationPassword
      });
      addToast(response.message, 'success');
      setIsInvitationOpen(false);
      setInvitationToken('');
      setInvitationPassword('');
    } catch (error) {
      addToast(error.message, 'danger');
    } finally {
      setIsAcceptingInvitation(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-900 text-slate-100 font-sans">
      {/* Left side: Hero Illustration & Gradient */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-12 flex-col justify-between border-r border-slate-800">
        {/* Animated background glow spheres */}
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

          {/* Feature Highlights Grid */}
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
            Live AI Core Online
          </span>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12 bg-slate-900">
        <div className="w-full max-w-md space-y-8 [&_input]:text-base [&_label]:text-sm">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to MarketMind
            </button>
          )}
          {/* Header */}
          <div className="text-center lg:text-left space-y-2">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">MarketMind AI</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {authMode === 'login' ? 'Sign in to workspace' : 'Create business account'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setErrorMessage('');
                  setMfaCode('');
                }}
                className="text-sm font-semibold text-indigo-400 hover:text-indigo-300"
              >
                {authMode === 'login' ? 'Register' : 'Back to login'}
              </button>
            </div>
            <p className="text-base leading-6 text-slate-400">
              {authMode === 'login'
                ? 'Enter credentials or select a pre-configured demo role below.'
                : 'Set up the first Business Owner account and store for a new workspace.'}
            </p>
          </div>

          {/* Quick Role Selector Demo Tabs */}
          {authMode === 'login' && <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Demo Access Role:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60">
              {MOCK_ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleChange(role.id)}
                  className={`py-2.5 px-2 rounded-lg text-sm font-medium transition-all text-center flex flex-col items-center gap-1 ${
                    selectedRole === role.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  <span className="font-semibold truncate w-full">{role.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-indigo-400 text-right font-medium">
              Active Selection: {MOCK_ROLES.find(r => r.id === selectedRole)?.name}
            </p>
          </div>}

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
              <>
                <Input
                  id="fullName"
                  label="Your Full Name"
                  placeholder="Aarav Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  icon={User}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    id="businessName"
                    label="Business Name"
                    placeholder="Aravali Mart"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    icon={Building2}
                    required
                  />
                  <Input
                    id="storeName"
                    label="First Store"
                    placeholder="Main Store"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    icon={Store}
                    required
                  />
                </div>
              </>
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

            {authMode === 'login' && selectedRole === 'admin' && (
              <Input
                id="mfaCode"
                label="Administrator MFA Code"
                inputMode="numeric"
                placeholder="6-digit code"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                icon={ShieldCheck}
                required
              />
            )}

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
            {authMode === 'login' && <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500/40"
                />
                <span>Remember this browser</span>
              </label>

              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>}

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
              {authMode === 'login' ? 'Sign In to Dashboard' : 'Create Business Workspace'}
            </Button>
          </form>

          {authMode === 'login' && (
            <button
              type="button"
              onClick={() => setIsInvitationOpen(true)}
              className="w-full text-center text-sm font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Have an employee invitation token? Activate your account
            </button>
          )}

          {/* Social Logins */}
          {authMode === 'login' && <div className="space-y-4 pt-2">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-sm text-slate-500 uppercase tracking-wider font-medium">Or continue with</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => addToast('Google Enterprise SSO simulated', 'info')}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-sm font-medium text-slate-300 transition-colors"
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
                onClick={() => addToast('Microsoft Entra ID SSO simulated', 'info')}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-sm font-medium text-slate-300 transition-colors"
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
          </div>}
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
            {isResetRequested
              ? 'Check your email, enter the one-time reset token, and choose a new password. Local development fills the token automatically.'
              : 'Enter your work email. If the account exists, MarketMind will send password-reset instructions to that address.'}
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
          {isResetRequested && (
            <>
              <Input
                id="resetToken"
                label="Reset Token"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                icon={CheckCircle2}
                required
              />
              <Input
                id="resetPassword"
                label="New Password"
                type="password"
                placeholder="At least 12 characters"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                icon={Lock}
                required
              />
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsForgotModalOpen(false);
                setResetToken('');
                setResetPassword('');
                setIsResetRequested(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={forgotSubmitted}>
              {isResetRequested ? 'Set New Password' : 'Email Reset Instructions'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isInvitationOpen}
        onClose={() => setIsInvitationOpen(false)}
        title="Activate Employee Account"
      >
        <form onSubmit={handleInvitationSubmit} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Paste the invitation token shared by your Business Owner and create your password.
          </p>
          <Input
            id="invitationToken"
            label="Invitation Token"
            value={invitationToken}
            onChange={(event) => setInvitationToken(event.target.value)}
            icon={CheckCircle2}
            required
          />
          <Input
            id="invitationPassword"
            label="Create Password"
            type="password"
            value={invitationPassword}
            onChange={(event) => setInvitationPassword(event.target.value)}
            icon={Lock}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsInvitationOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isAcceptingInvitation}>
              Activate Account
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title="Verify Email Address"
      >
        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Paste the verification token sent to the registered email address. In development,
            MarketMind fills this field automatically.
          </p>
          <Input
            id="verifyToken"
            label="Verification Token"
            value={verifyToken}
            onChange={(e) => setVerifyToken(e.target.value)}
            icon={CheckCircle2}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsVerifyModalOpen(false)}>
              Verify Later
            </Button>
            <Button type="submit" variant="primary" isLoading={isVerifying}>
              Confirm Email
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
