import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../../context/ToastContext';
import { Settings, Shield, Bell, Key, Save } from 'lucide-react';

export const SettingsModule = () => {
  const { addToast } = useToast();

  const handleSave = (e) => {
    e.preventDefault();
    addToast('System settings saved successfully!', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-500" />
          <span>System & Workspace Settings</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure API integrations, AI threshold alerts, and organizational branding
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              <div>
                <CardTitle>Organization Profile</CardTitle>
                <CardDescription>Company details appearing on POS invoices</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Company Legal Name" defaultValue="MarketMind Retail Systems Inc." />
            <Input label="Support Email Address" defaultValue="support@marketmind.ai" />
            <Input label="Tax ID / VAT Registration" defaultValue="US-991204812" />
            <Input label="Default Currency" defaultValue="USD ($)" />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              <div>
                <CardTitle>AI Core Engine API Key</CardTitle>
                <CardDescription>Credentials for predictive machine learning model</CardDescription>
              </div>
            </div>
          </CardHeader>
          <Input label="Active API Key Token" type="password" defaultValue="sk-marketmind-ai-prod-9982412857" />
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" icon={Save}>
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};
