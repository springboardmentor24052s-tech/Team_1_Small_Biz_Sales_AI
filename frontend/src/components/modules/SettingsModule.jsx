import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Database,
  Languages,
  LayoutGrid,
  MonitorCog,
  Save,
  ShieldCheck,
  Store,
  Trash2,
  UserRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { ProfileAvatar } from '../common/ProfileAvatar';

const selectClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100';

const fieldLabel = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400';

const preferenceDefaults = {
  locale: 'en-IN',
  timezone: 'Asia/Kolkata',
  theme_preference: 'system',
  date_format: 'DD/MM/YYYY',
  dashboard_density: 'comfortable',
  email_notifications: true
};

const avatarChoices = ['🙂', '👨‍💼', '👩‍💼', '🧑‍💼', '🚀'];

const rolePreferenceDefaults = {
  owner: { default_period: '30', weekly_summary: true, revenue_alerts: true, stock_alerts: true, sales_performance_alerts: true, customer_decline_alerts: true },
  manager: { inventory_view: 'all', stock_alerts: true, daily_store_summary: true, sales_performance_alerts: true, customer_decline_alerts: true },
  sales: { sales_period: '30', follow_up_reminders: true, customer_activity_alerts: true, sales_performance_alerts: true, customer_decline_alerts: true },
  admin: { monitoring_refresh: '60', audit_alerts: true, model_failure_alerts: true, security_alerts: true }
};

const formatDate = (value, format) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  return `${day}/${month}/${year}`;
};

export const SettingsModule = ({ onNavigate }) => {
  const {
    currentRole,
    profile,
    updateProfile,
    uploadAvatar,
    deleteAvatar
  } = useAuth();
  const { setThemePreference } = useTheme();
  const { addToast } = useToast();
  const fileInput = useRef(null);
  const isAdmin = currentRole.id === 'admin';
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    full_name: '', phone_number: '', job_title: '', location: '', bio: '', date_of_birth: '',
    avatar_emoji: '🙂', role_preferences: rolePreferenceDefaults[currentRole.id], ...preferenceDefaults
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name || '',
      phone_number: profile.phone_number || '',
      job_title: profile.job_title || '',
      location: profile.location || '',
      bio: profile.bio || '',
      date_of_birth: profile.date_of_birth || '',
      avatar_emoji: profile.avatar_emoji || '🙂',
      role_preferences: {
        ...rolePreferenceDefaults[currentRole.id],
        ...(profile.role_preferences || {})
      },
      locale: profile.locale || preferenceDefaults.locale,
      timezone: profile.timezone || preferenceDefaults.timezone,
      theme_preference: profile.theme_preference || preferenceDefaults.theme_preference,
      date_format: profile.date_format || preferenceDefaults.date_format,
      dashboard_density: profile.dashboard_density || preferenceDefaults.dashboard_density,
      email_notifications: profile.email_notifications ?? true
    });
  }, [currentRole.id, profile]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateRolePreference = (field, value) => setForm((current) => ({
    ...current,
    role_preferences: { ...current.role_preferences, [field]: value }
  }));

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const preferences = {
        locale: form.locale,
        timezone: form.timezone,
        theme_preference: form.theme_preference,
        date_format: form.date_format,
        dashboard_density: form.dashboard_density,
        email_notifications: form.email_notifications,
        role_preferences: form.role_preferences
      };
      await updateProfile(isAdmin ? preferences : {
        ...preferences,
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim() || null,
        job_title: form.job_title.trim() || null,
        location: form.location.trim() || null,
        bio: form.bio.trim() || null,
        date_of_birth: form.date_of_birth || null,
        avatar_emoji: form.avatar_emoji
      });
      setThemePreference(form.theme_preference);
      setSavedAt(new Date());
      addToast('Preferences saved and applied', 'success');
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      addToast('Profile photo must be 2 MB or smaller', 'error');
      return;
    }
    setUploading(true);
    try {
      await uploadAvatar(file);
      addToast('Profile photo updated', 'success');
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    setUploading(true);
    try {
      await deleteAvatar();
      addToast('Profile photo removed', 'success');
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const joinedDate = formatDate(profile?.joined_at, form.date_format);

  return (
    <form onSubmit={saveSettings} className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {isAdmin ? <MonitorCog className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
            {isAdmin ? 'Internal administration' : `${currentRole.name} account`}
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {isAdmin ? 'Platform Settings' : 'Profile & Preferences'}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isAdmin
              ? 'Security and console preferences for the internal MarketMind Administrator.'
              : 'Keep your work profile current and choose how your dashboard behaves.'}
          </p>
        </div>
        <div className="flex items-center gap-3">{savedAt && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" />Active since {savedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}<Button type="submit" icon={Save} isLoading={saving}>Save & Apply</Button></div>
      </div>

      {!isAdmin && (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-6 bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 p-6 text-white sm:flex-row sm:items-center">
            <div className="relative">
              <ProfileAvatar profile={{ ...profile, avatar_emoji: form.avatar_emoji }} fallbackImage={currentRole.avatar} className="h-24 w-24 rounded-2xl border-2 border-white/30 text-5xl shadow-xl" />
              <button type="button" onClick={() => fileInput.current?.click()} className="absolute -bottom-2 -right-2 rounded-xl bg-indigo-500 p-2 text-white shadow-lg hover:bg-indigo-400" title="Change profile photo">
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={selectAvatar} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-2xl font-bold">{profile?.full_name}</h3>
              <p className="text-sm text-indigo-200">{profile?.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="info">{profile?.role?.name}</Badge>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">Joined {joinedDate}</span>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-200">Email verified</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="glass" onClick={() => fileInput.current?.click()} isLoading={uploading}>Upload Photo</Button>
              {profile?.avatar_url && <Button type="button" variant="danger" icon={Trash2} onClick={removeAvatar} disabled={uploading}>Remove</Button>}
            </div>
          </div>
          {!profile?.avatar_url && (
            <div className="border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Choose a default avatar</p>
              <div className="flex flex-wrap gap-3">
                {avatarChoices.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => updateField('avatar_emoji', emoji)}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border text-2xl transition ${form.avatar_emoji === emoji ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20 dark:bg-indigo-950/50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800'}`}
                    aria-label={`Use ${emoji} as default avatar`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">This avatar appears in the sidebar and header until you upload a photo.</p>
            </div>
          )}
        </Card>
      )}

      {isAdmin ? (
        <AdminSecurity profile={profile} onNavigate={onNavigate} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><div><CardTitle>Personal Information</CardTitle><CardDescription>Information used inside your authorised workspace.</CardDescription></div><UserRound className="h-5 w-5 text-indigo-500" /></CardHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <Input id="profileName" label="Full Name" value={form.full_name} onChange={(event) => updateField('full_name', event.target.value)} required />
              <Input id="profilePhone" label="Phone Number" placeholder="+91 98765 43210" value={form.phone_number} onChange={(event) => updateField('phone_number', event.target.value)} />
              <Input id="profileTitle" label="Job Title" placeholder={currentRole.id === 'owner' ? 'Founder / Proprietor' : currentRole.name} value={form.job_title} onChange={(event) => updateField('job_title', event.target.value)} />
              <Input id="profileLocation" label="Location" placeholder="Jaipur, Rajasthan" value={form.location} onChange={(event) => updateField('location', event.target.value)} />
              <Input id="profileDateOfBirth" label="Date of Birth" type="date" value={form.date_of_birth} onChange={(event) => updateField('date_of_birth', event.target.value)} />
              <div><label className={fieldLabel}>Joined MarketMind</label><div className="rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">{joinedDate}</div><p className="mt-1 text-xs text-slate-400">Created automatically and cannot be edited.</p></div>
              <div className="md:col-span-2"><label htmlFor="profileBio" className={fieldLabel}>Short Bio</label><textarea id="profileBio" rows="4" maxLength="500" value={form.bio} onChange={(event) => updateField('bio', event.target.value)} placeholder="A short description of your responsibilities..." className={selectClass} /><p className="mt-1 text-right text-xs text-slate-400">{form.bio.length}/500</p></div>
            </div>
          </Card>

          <RoleDetails profile={profile} currentRole={currentRole} onNavigate={onNavigate} />
        </div>
      )}

      <Preferences form={form} updateField={updateField} isAdmin={isAdmin} />
      <RolePreferences roleId={currentRole.id} values={form.role_preferences} update={updateRolePreference} />

      <Card>
        <CardHeader><div><CardTitle>Account Security</CardTitle><CardDescription>Live security information from your MarketMind account.</CardDescription></div><ShieldCheck className="h-5 w-5 text-emerald-500" /></CardHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatusItem icon={CheckCircle2} label="Account status" value={profile?.status || 'Unknown'} />
          <StatusItem icon={ShieldCheck} label="Multi-factor authentication" value={profile?.mfa_enabled ? 'Enabled' : isAdmin ? 'Required' : 'Not required'} />
          <StatusItem icon={Clock3} label="Last login" value={profile?.last_login_at ? `${formatDate(profile.last_login_at, form.date_format)} ${new Date(profile.last_login_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'First session'} />
        </div>
        <p className="mt-4 text-xs text-slate-500">Passwords are never displayed here. Use “Forgot password” on the sign-in page to securely reset one.</p>
      </Card>
    </form>
  );
};

const RoleDetails = ({ profile, currentRole, onNavigate }) => {
  const copy = currentRole.id === 'owner'
    ? { icon: Building2, title: 'Business Workspace', lines: [profile?.tenant_name, `Currency: ${profile?.currency || 'INR'}`], action: 'Manage Team', tab: 'team' }
    : currentRole.id === 'manager'
      ? { icon: Store, title: 'Store Assignment', lines: [profile?.store?.name || 'No store assigned', profile?.store ? `Store code: ${profile.store.code}` : 'Contact your Business Owner'] }
      : { icon: BriefcaseBusiness, title: 'Sales Scope', lines: [profile?.store?.name || 'No store assigned', 'Personal sales and assigned customers only'] };
  const Icon = copy.icon;
  return (
    <Card>
      <CardHeader><div><CardTitle>{copy.title}</CardTitle><CardDescription>Your protected business assignment.</CardDescription></div><Icon className="h-5 w-5 text-indigo-500" /></CardHeader>
      <div className="space-y-3">{copy.lines.filter(Boolean).map((line) => <div key={line} className="rounded-xl bg-slate-50 p-3 text-sm font-medium dark:bg-slate-800/50">{line}</div>)}</div>
      {copy.action && <Button type="button" className="mt-4 w-full" variant="outline" onClick={() => onNavigate(copy.tab)}>{copy.action}</Button>}
    </Card>
  );
};

const Preferences = ({ form, updateField, isAdmin }) => (
  <Card>
    <CardHeader><div><CardTitle>{isAdmin ? 'Console Preferences' : 'Dashboard Preferences'}</CardTitle><CardDescription>Saved to your account and applied immediately across your authorised workspace.</CardDescription></div><LayoutGrid className="h-5 w-5 text-indigo-500" /></CardHeader>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <SelectField icon={Languages} label="Language" value={form.locale} onChange={(value) => updateField('locale', value)} options={[['en-IN', 'English (India)'], ['hi-IN', 'हिन्दी (भारत)']]} />
      <SelectField icon={Clock3} label="Time Zone" value={form.timezone} onChange={(value) => updateField('timezone', value)} options={[['Asia/Kolkata', 'India Standard Time'], ['Asia/Dubai', 'Gulf Standard Time'], ['UTC', 'UTC']]} />
      <SelectField icon={MonitorCog} label="Theme" value={form.theme_preference} onChange={(value) => updateField('theme_preference', value)} options={[['system', 'Use device setting'], ['light', 'Light'], ['dark', 'Dark']]} />
      <SelectField icon={CalendarDays} label="Display Date Format" value={form.date_format} onChange={(value) => updateField('date_format', value)} options={[['DD/MM/YYYY', 'DD/MM/YYYY (20/08/2026)'], ['MM/DD/YYYY', 'MM/DD/YYYY (08/20/2026)'], ['YYYY-MM-DD', 'YYYY-MM-DD (2026-08-20)']]} />
      <SelectField icon={LayoutGrid} label="Dashboard Density" value={form.dashboard_density} onChange={(value) => updateField('dashboard_density', value)} options={[['comfortable', 'Comfortable'], ['compact', 'Compact']]} />
      <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60"><span className="flex items-center gap-2 text-sm font-medium"><Bell className="h-4 w-4 text-indigo-500" />Email delivery when configured</span><input type="checkbox" checked={form.email_notifications} onChange={(event) => updateField('email_notifications', event.target.checked)} className="h-4 w-4 accent-indigo-600" /></label>
    </div>
  </Card>
);

const RolePreferences = ({ roleId, values = {}, update }) => {
  const content = {
    owner: {
      title: 'Business Owner Preferences',
      description: 'Choose the default business view and executive alerts.',
      select: { label: 'Default KPI Period', key: 'default_period', options: [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days']] },
      toggles: [['weekly_summary', 'Weekly business summary', 'Show a live seven-day revenue summary in notifications.'], ['revenue_alerts', 'Revenue change alerts', 'Notify when revenue changes by at least 10% between periods.'], ['stock_alerts', 'Low inventory alerts', 'Warn when products are low or out of stock.'], ['sales_performance_alerts', 'Daily sales and target alerts', 'Compare current sales with the previous day and active targets.'], ['customer_decline_alerts', 'Customer decline alerts', 'Flag customers whose recent purchasing has dropped significantly.']]
    },
    manager: {
      title: 'Store Manager Preferences',
      description: 'Prioritise the inventory and store information you use every day.',
      select: { label: 'Default Inventory View', key: 'inventory_view', options: [['all', 'All inventory'], ['low_stock', 'Low stock first'], ['out_of_stock', 'Out of stock first']] },
      toggles: [['stock_alerts', 'Stock risk alerts', 'Show or hide stock warnings, the priority queue and notifications.'], ['daily_store_summary', 'Daily store summary', 'Show a current operations summary for your assigned store.'], ['sales_performance_alerts', 'Daily sales and target alerts', 'Track store sales movement and employee target progress.'], ['customer_decline_alerts', 'Customer decline alerts', 'Flag store customers whose purchasing has dropped significantly.']]
    },
    sales: {
      title: 'Sales Executive Preferences',
      description: 'Keep personal sales and customer follow-ups focused.',
      select: { label: 'Default Sales Period', key: 'sales_period', options: [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days']] },
      toggles: [['follow_up_reminders', 'Customer follow-up reminders', 'Notify when assigned customers have been inactive for 60 days.'], ['customer_activity_alerts', 'Customer activity alerts', 'Notify about recent purchases by assigned customers.'], ['sales_performance_alerts', 'Daily sales and target alerts', 'Track your sales movement and active target progress.'], ['customer_decline_alerts', 'Customer decline alerts', 'Flag assigned customers whose purchasing has dropped significantly.']]
    },
    admin: {
      title: 'Administrator Monitoring Preferences',
      description: 'Configure internal platform monitoring and security alerts.',
      select: { label: 'Monitoring Refresh', key: 'monitoring_refresh', options: [['30', 'Every 30 seconds'], ['60', 'Every minute'], ['300', 'Every 5 minutes']] },
      toggles: [['audit_alerts', 'Audit alerts', 'Notify on important permission and security events.'], ['model_failure_alerts', 'Model failure alerts', 'Notify when forecasting jobs or models fail.'], ['security_alerts', 'Security alerts', 'Notify on suspicious login or access activity.']]
    }
  }[roleId];
  if (!content) return null;
  return (
    <Card>
      <CardHeader><div><CardTitle>{content.title}</CardTitle><CardDescription>{content.description}</CardDescription></div><MonitorCog className="h-5 w-5 text-indigo-500" /></CardHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SelectField icon={LayoutGrid} label={content.select.label} value={values[content.select.key] || content.select.options[0][0]} onChange={(value) => update(content.select.key, value)} options={content.select.options} />
        {content.toggles.map(([key, label, description]) => (
          <ToggleSetting key={key} label={label} description={description} checked={values[key] ?? true} onChange={(checked) => update(key, checked)} />
        ))}
      </div>
    </Card>
  );
};

const ToggleSetting = ({ label, description, checked, onChange }) => (
  <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
    <span><span className="block text-sm font-bold">{label}</span><span className="mt-1 block text-xs leading-relaxed text-slate-500">{description}</span></span>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-indigo-600" />
  </label>
);

const SelectField = ({ icon: Icon, label, value, onChange, options }) => (
  <div><label className={fieldLabel}><span className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{label}</span></label><select value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>{options.map(([optionValue, text]) => <option key={optionValue} value={optionValue}>{text}</option>)}</select></div>
);

const StatusItem = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><Icon className="mb-3 h-5 w-5 text-indigo-500" /><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-bold capitalize">{value}</p></div>
);

const AdminSecurity = ({ profile, onNavigate }) => (
  <div className="grid gap-6 lg:grid-cols-2">
    <Card>
      <CardHeader><div><CardTitle>Platform Security</CardTitle><CardDescription>This is the single internal Administrator workspace.</CardDescription></div><ShieldCheck className="h-5 w-5 text-purple-500" /></CardHeader>
      <div className="space-y-3"><StatusItem icon={ShieldCheck} label="MFA enforcement" value={profile?.mfa_enabled ? 'Enabled and verified' : 'Setup required'} /><StatusItem icon={UserRound} label="Account type" value="Internal platform administrator" /></div>
    </Card>
    <Card>
      <CardHeader><div><CardTitle>Platform Operations</CardTitle><CardDescription>Administration remains separate from business employee management.</CardDescription></div><Database className="h-5 w-5 text-blue-500" /></CardHeader>
      <div className="space-y-3"><div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/50">RBAC policy and security audit</div><div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/50">Dataset and forecasting model monitoring</div><div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/50">No employee invitation or store assignment access</div></div>
      <Button type="button" className="mt-4 w-full" onClick={() => onNavigate('reports')}>Open Model Monitoring</Button>
    </Card>
  </div>
);
