import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ChurnPredictionModule } from '../components/modules/ChurnPredictionModule'
import { churnService } from '../services/churnService'

const mockAddToast = vi.fn()

vi.mock('../services/churnService', () => ({
  churnService: {
    getChurnSummary: vi.fn(),
    getChurnCustomers: vi.fn(),
  },
}))

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}))

describe('ChurnPredictionModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    churnService.getChurnSummary.mockResolvedValue({
      total_customers_analyzed: 120,
      high_risk_count: 5,
      medium_risk_count: 12,
      low_risk_count: 103,
      potential_revenue_at_risk: 185400,
      accuracy: 0.94,
      insights: ['Offer renewal discount for clients inactive > 30 days.'],
    })

    churnService.getChurnCustomers.mockResolvedValue({
      items: [
        {
          customer_id: 'cust-1',
          external_customer_id: 'CUST-001',
          customer_name: 'Sharma Kirana Store',
          churn_probability: 0.85,
          risk_level: 'High Risk',
          inactivity_days: 45,
          total_revenue: 125000,
          retention_recommendation: 'Offer 20% discount on POS rolls',
          email: 'sharma@example.com',
          phone: '+91 98765 43210',
        },
      ],
      total: 1,
    })
  })

  it('renders churn summary metrics and customer rows correctly', async () => {
    render(<ChurnPredictionModule />)

    await waitFor(() => {
      expect(screen.getByText('At-Risk Account Retention Analytics')).toBeInTheDocument()
      expect(screen.getByText('120 Accounts')).toBeInTheDocument()
      expect(screen.getByText('5 Clients')).toBeInTheDocument()
      expect(screen.getByText('Sharma Kirana Store')).toBeInTheDocument()
    })
  })

  it('handles API error state gracefully', async () => {
    churnService.getChurnCustomers.mockRejectedValueOnce(
      new Error('Churn service failed')
    )

    render(<ChurnPredictionModule />)

    await waitFor(() => {
      expect(
        screen.getByText('Churn prediction data is temporarily unavailable. Please try again.')
      ).toBeInTheDocument()
    })
  })
})
