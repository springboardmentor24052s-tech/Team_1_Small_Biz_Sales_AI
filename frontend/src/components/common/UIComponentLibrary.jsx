import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Skeleton, CardSkeleton } from '../ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import { Layers, Sparkles, AlertTriangle, Check, Mail, Heart, Lock } from 'lucide-react';

export const UIComponentLibrary = () => {
  const { addToast } = useToast();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoInput, setDemoInput] = useState('');

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-indigo-600">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Enterprise UI Design System & Component Library</h2>
            <p className="text-xs text-indigo-300">Production-grade atomic design tokens built for scale</p>
          </div>
        </div>
      </div>

      {/* Buttons Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Button Components</CardTitle>
          <CardDescription>Multiple variants, sizes, and states</CardDescription>
        </CardHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={() => addToast('Primary Action clicked', 'success')}>Primary</Button>
            <Button variant="secondary" onClick={() => addToast('Secondary clicked', 'info')}>Secondary</Button>
            <Button variant="outline" onClick={() => addToast('Outline clicked', 'info')}>Outline</Button>
            <Button variant="danger" onClick={() => addToast('Danger Action clicked', 'error')}>Danger</Button>
            <Button variant="ghost" onClick={() => addToast('Ghost clicked', 'info')}>Ghost</Button>
            <Button variant="glass" onClick={() => addToast('Glassmorphism clicked', 'info')}>Glass</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="primary" size="sm" icon={Sparkles}>Small + Icon</Button>
            <Button variant="primary" size="md" icon={Mail}>Medium + Icon</Button>
            <Button variant="primary" size="lg" icon={Heart}>Large + Icon</Button>
            <Button variant="primary" isLoading>Loading State</Button>
            <Button variant="primary" disabled>Disabled State</Button>
          </div>
        </div>
      </Card>

      {/* Badges Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Status & Badge Tokens</CardTitle>
          <CardDescription>Semantics for metrics and alerts</CardDescription>
        </CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success">Success Badge</Badge>
          <Badge variant="warning">Warning Badge</Badge>
          <Badge variant="danger">Danger Badge</Badge>
          <Badge variant="info">Info Badge</Badge>
          <Badge variant="neutral">Neutral Tag</Badge>
        </div>
      </Card>

      {/* Inputs Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Input Field Controls</CardTitle>
          <CardDescription>Focus rings, icons, and error states</CardDescription>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="demoStandard"
            label="Standard Input"
            placeholder="Type something..."
            value={demoInput}
            onChange={(e) => setDemoInput(e.target.value)}
          />
          <Input
            id="demoIcon"
            label="Input with Icon"
            placeholder="Email address"
            icon={Mail}
          />
          <Input
            id="demoError"
            label="Error Validation State"
            placeholder="Invalid value..."
            error="Required field missing"
            icon={Lock}
          />
        </div>
      </Card>

      {/* Skeleton Loading Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Skeleton Loaders</CardTitle>
          <CardDescription>Smooth pulse shimmer placeholder animation</CardDescription>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton />
          <div className="space-y-3 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <Skeleton height="h-6" width="w-3/4" />
            <Skeleton height="h-4" width="w-full" />
            <Skeleton height="h-4" width="w-5/6" />
            <Skeleton height="h-10" width="w-1/2" rounded="rounded-xl" />
          </div>
        </div>
      </Card>

      {/* Interactive Modals & Toast Triggers */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Modals & Toast Alerts</CardTitle>
          <CardDescription>Dynamic popup overlays</CardDescription>
        </CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={() => setIsDemoModalOpen(true)}>
            Open Sample Modal
          </Button>

          <Button variant="secondary" onClick={() => addToast('Success Toast Notification Triggered!', 'success')}>
            Test Success Toast
          </Button>

          <Button variant="secondary" onClick={() => addToast('Warning Stock Threshold Reached!', 'warning')}>
            Test Warning Toast
          </Button>

          <Button variant="secondary" onClick={() => addToast('Connection Error 500 Failure!', 'error')}>
            Test Error Toast
          </Button>
        </div>
      </Card>

      {/* Demo Modal */}
      <Modal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title="Reusable Modal Component"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDemoModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => { addToast('Saved from modal!', 'success'); setIsDemoModalOpen(false); }}>
              Confirm Action
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This is a full modal dialog featuring glassmorphic backdrops, smooth scale animations, escape key listeners, and accessible focus management.
        </p>
      </Modal>
    </div>
  );
};
