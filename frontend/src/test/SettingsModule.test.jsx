import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { SettingsModule } from '../components/modules/SettingsModule'

const mockUpdateProfile = vi.fn()
const mockUploadAvatar = vi.fn()
const mockDeleteAvatar = vi.fn()
const mockSetThemePreference = vi.fn()
const mockAddToast = vi.fn()
const mockOnNavigate = vi.fn()

const mockProfile = {
  full_name: 'Garvit K',
  email: 'owner@marketmind.ai',
  phone_number: '+91 98765 43210',
  job_title: 'Business Owner',
  location: 'Jaipur, Rajasthan',
  bio: 'Managing retail distribution operations.',
  avatar_emoji: '🙂',
  joined_at: '2026-01-01T00:00:00Z',
  tenant_name: 'Garvit Enterprises',
  currency: 'INR',
  status: 'Active',
  mfa_enabled: false,
}

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    currentRole: { id: 'owner', name: 'Business Owner' },
    profile: mockProfile,
    updateProfile: mockUpdateProfile,
    uploadAvatar: mockUploadAvatar,
    deleteAvatar: mockDeleteAvatar,
  }),
}))

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    setThemePreference: mockSetThemePreference,
  }),
}))

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}))

describe('SettingsModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders owner profile information and settings header correctly', async () => {
    render(<SettingsModule onNavigate={mockOnNavigate} />)

    await waitFor(() => {
      expect(screen.getByText('Profile & Platform Preferences')).toBeInTheDocument()
      expect(screen.getAllByText('Garvit K').length).toBeGreaterThan(0)
      expect(screen.getByText('Personal Commercial Profile')).toBeInTheDocument()
      expect(screen.getByText('Business Owner Executive Alert Preferences')).toBeInTheDocument()
    })
  })
})
