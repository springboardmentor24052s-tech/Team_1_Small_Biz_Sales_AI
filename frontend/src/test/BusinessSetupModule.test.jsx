import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BusinessSetupModule } from '../components/modules/BusinessSetupModule'

const mockApi = vi.fn()
const mockReauthenticate = vi.fn()
const mockRefresh = vi.fn()
const mockAddToast = vi.fn()

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    api: mockApi,
    reauthenticate: mockReauthenticate,
    profile: {
      tenant_name: 'Sharma Traders',
      timezone: 'Asia/Kolkata',
    },
  }),
}))

vi.mock('../context/DataContext', () => ({
  useData: () => ({
    users: [],
    refresh: mockRefresh,
  }),
}))

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}))

describe('BusinessSetupModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockApi.mockImplementation((endpoint) => {
      if (endpoint === '/onboarding/status') {
        return Promise.resolve({
          completion_percentage: 85,
          checklist: {
            business_created: true,
            store_ready: true,
            team_ready: true,
            products_ready: true,
            inventory_ready: true,
            customers_ready: true,
            sales_ready: true,
          },
          recent_imports: [],
        })
      }
      if (endpoint === '/users/stores/catalog') {
        return Promise.resolve([
          { id: 'store-1', name: 'Main Store', code: 'DEL-01' },
        ])
      }
      if (endpoint === '/intelligence/readiness') {
        return Promise.resolve({
          ready_to_train: true,
          refresh_recommended: false,
          revenue: { ready: true, observed_records: 120 },
        })
      }
      return Promise.resolve({})
    })
  })

  it('renders business onboarding header and CSV templates', async () => {
    render(<BusinessSetupModule />)

    await waitFor(() => {
      expect(screen.getByText(/Configure Sharma Traders/i)).toBeInTheDocument()
      expect(screen.getByText('Import Business Data (CSV)')).toBeInTheDocument()
      expect(screen.getByText('Product Catalog')).toBeInTheDocument()
      expect(screen.getByText('Opening Inventory')).toBeInTheDocument()
    })
  })
})
