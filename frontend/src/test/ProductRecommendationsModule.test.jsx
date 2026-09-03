import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ProductRecommendationsModule } from '../components/modules/ProductRecommendationsModule'
import recommendationService from '../services/recommendationService'

const mockAddToast = vi.fn()

vi.mock('../services/recommendationService', () => ({
  default: {
    getRecommendations: vi.fn(),
    getAnalytics: vi.fn(),
    getEvaluation: vi.fn(),
    getInsights: vi.fn(),
    getCustomers: vi.fn(),
    getProducts: vi.fn(),
  },
}))

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    currentRole: { id: 'owner' },
  }),
}))

describe('ProductRecommendationsModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    recommendationService.getRecommendations.mockRejectedValue(
      new Error('Recommendation API unavailable')
    )
    recommendationService.getAnalytics.mockResolvedValue({
      potential_revenue_boost: 0,
      total_recommendations: 0,
      average_match_score: 0,
      conversion_rate: 0,
    })
    recommendationService.getEvaluation.mockResolvedValue({
      precision_at_k: 0,
      recall_at_k: 0,
      f1_at_k: 0,
    })
    recommendationService.getInsights.mockResolvedValue({ insights: [] })
    recommendationService.getCustomers.mockResolvedValue({ items: [] })
    recommendationService.getProducts.mockResolvedValue({ items: [] })
  })

  it('shows the recommendation error state when the recommendation API fails', async () => {
    render(<ProductRecommendationsModule />)

    await waitFor(() => {
      expect(
        screen.getByText('Recommendations Unavailable')
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText(
        'Recommendation data is temporarily unavailable. Please try again.'
      )
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: 'Retry' })
    ).toBeInTheDocument()
  })

  it('retries recommendation loading when the Retry button is clicked', async () => {
    render(<ProductRecommendationsModule />)

    await waitFor(() => {
      expect(
        screen.getByText('Recommendations Unavailable')
      ).toBeInTheDocument()
    })

    recommendationService.getRecommendations.mockResolvedValue({
      recommendations: [],
    })

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    await waitFor(() => {
      expect(recommendationService.getRecommendations).toHaveBeenCalledTimes(2)
    })
  })
})
