import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ManagerDashboard } from '../components/dashboards/ManagerDashboard'

const mockApi = vi.fn()
const mockRefresh = vi.fn()
const mockAddToast = vi.fn()

const mockInventoryItems = [
  {
    id: 'inv-1',
    product_id: 'prod-1',
    stock_quantity: 45,
    reorder_level: 10,
    stock_status: 'in_stock',
    batch_number: 'BATCH-2026-X1',
    expiry_date: '2027-12-31',
    product: {
      id: 'prod-1',
      sku: 'FMCG-TEA-100',
      name: 'Premium Assam Tea 500g',
      category: 'Beverages',
      unit_price: 350,
      hsn_code: '0902',
      pack_size: '12 Units/Box',
    },
  },
]

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    api: mockApi,
    profile: {
      preferences: {
        stock_alerts_enabled: true,
      },
    },
  }),
}))

vi.mock('../context/DataContext', () => ({
  useData: () => ({
    inventorySummary: {},
    inventoryItems: mockInventoryItems,
    refresh: mockRefresh,
  }),
}))

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}))

describe('ManagerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockApi.mockImplementation((endpoint) => {
      if (endpoint === '/team/overview') {
        return Promise.resolve({
          employees: [
            {
              employee_id: 'emp-1',
              full_name: 'Rahul Sharma',
              role_name: 'Sales Executive',
              metrics: { revenue: 145200, transactions: 24, average_order_value: 6050 },
              target: { target_value: 150000 },
              status: 'active',
            },
          ],
        })
      }
      return Promise.resolve({})
    })
  })

  it('renders store manager operations header, stock valuation KPIs, and employee performance correctly', async () => {
    render(<ManagerDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Store Manager Operations Hub')).toBeInTheDocument()
      expect(screen.getByText('Premium Assam Tea 500g')).toBeInTheDocument()
      expect(screen.getByText('Rahul Sharma')).toBeInTheDocument()
    })
  })
})
