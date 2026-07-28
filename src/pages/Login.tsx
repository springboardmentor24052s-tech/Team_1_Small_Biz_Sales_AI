import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => navigate('/dashboard'), 1200)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif' }}>
      {/* Left panel — brand */}
      <div style={{
        flex: '0 0 52%', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 40%, #4f46e5 80%, #7c3aed 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 48,
      }}>
        {/* Grid overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Floating orbs */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.3)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: 100, left: -80, width: 260, height: 260, borderRadius: '50%', background: 'rgba(37,99,235,0.4)', filter: 'blur(50px)' }} />

        {/* Logo */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>MarketMind AI</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Sales Intelligence Platform</div>
          </div>
        </div>

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', fontSize: 12, fontWeight: 500, color: '#fff', marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            AI-Powered Insights
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1.15, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Turn your sales data into competitive advantage
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0, maxWidth: 400 }}>
            Predictive analytics, AI forecasting, and real-time customer intelligence — all in one platform built for small business success.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, marginTop: 40 }}>
            {[['2.4M+', 'Transactions Analyzed'], ['98.7%', 'Forecast Accuracy'], ['12min', 'Avg. Setup Time']].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{v}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div style={{ position: 'relative', padding: 20, borderRadius: 14, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
            {[1,2,3,4,5].map(i => <span key={i} style={{ color: '#f59e0b', fontSize: 14 }}>★</span>)}
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, margin: '0 0 12px' }}>
            "MarketMind AI transformed how we understand our customers. Revenue grew 34% in 6 months."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>SK</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Sarah Kim</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Owner, Bloom Boutique</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Tab toggle */}
          <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: 10, padding: 3, marginBottom: 32 }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#0f172a' : '#64748b',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 28px' }}>
            {mode === 'login' ? 'Enter your credentials to access your dashboard.' : 'Start your 14-day free trial, no credit card required.'}
          </p>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Sarah Mitchell" required style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, fontFamily: 'Inter, sans-serif', color: '#0f172a', background: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@example.com" required style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, fontFamily: 'Inter, sans-serif', color: '#0f172a', background: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: mode === 'login' ? 8 : 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, fontFamily: 'Inter, sans-serif', color: '#0f172a', background: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginBottom: 20 }}>
                <a href="#" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
              </div>
            )}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
              background: loading ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #4f46e5)',
              color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'Inter, sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '-0.01em',
            }}>
              {loading ? 'Signing in…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <div style={{ position: 'relative', margin: '24px 0', textAlign: 'center' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: '#e2e8f0' }} />
            <span style={{ position: 'relative', background: '#f8fafc', padding: '0 12px', fontSize: 12, color: '#94a3b8' }}>Or continue with</span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {['Google', 'Microsoft'].map(p => (
              <button key={p} style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#334155', cursor: 'pointer' }}>
                {p}
              </button>
            ))}
          </div>

          {mode === 'register' && (
            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>
              By signing up, you agree to our{' '}
              <a href="#" style={{ color: '#2563eb', textDecoration: 'none' }}>Terms of Service</a>{' '}
              and{' '}
              <a href="#" style={{ color: '#2563eb', textDecoration: 'none' }}>Privacy Policy</a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
