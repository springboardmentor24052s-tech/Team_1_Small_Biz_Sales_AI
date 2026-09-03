import { beforeEach, describe, expect, it, vi } from 'vitest'
import { recommendationService } from '../services/recommendationService'
import { request } from '../api/client'

vi.mock('../api/client', () => ({
  request: vi.fn(),
}))

describe('recommendationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    request.mockResolvedValue({ status: 'ok' })
  })

  it('fetches recommendations with query parameters', async () => {
    await recommendationService.getRecommendations({
      customer_id: 'customer-1',
      limit: 5,
    })

    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('/recommendations?')
    )

    const calledPath = request.mock.calls[0][0]

    expect(calledPath).toContain('customer_id=customer-1')
    expect(calledPath).toContain('limit=5')
  })

  it('fetches recommendations without parameters', async () => {
    await recommendationService.getRecommendations()

    expect(request).toHaveBeenCalledWith('/recommendations')
  })

  it('fetches recommendation analytics', async () => {
    await recommendationService.getAnalytics()

    expect(request).toHaveBeenCalledWith('/recommendations/analytics')
  })

  it('fetches evaluation metrics with the requested k value', async () => {
    await recommendationService.getEvaluation(10)

    expect(request).toHaveBeenCalledWith('/recommendations/evaluation?k=10')
  })

  it('fetches recommendation insights', async () => {
    await recommendationService.getInsights()

    expect(request).toHaveBeenCalledWith('/recommendations/insights')
  })

  it('fetches customers with the expected limit', async () => {
    await recommendationService.getCustomers()

    expect(request).toHaveBeenCalledWith('/customers?limit=200')
  })

  it('fetches products with the expected limit', async () => {
    await recommendationService.getProducts()

    expect(request).toHaveBeenCalledWith('/inventory?limit=200')
  })
})
