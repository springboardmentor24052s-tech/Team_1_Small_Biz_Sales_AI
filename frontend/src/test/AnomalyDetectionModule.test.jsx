import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AnomalyDetectionModule } from '../components/modules/AnomalyDetectionModule'
import { anomalyService } from '../services/anomalyService'

const mockAddToast = vi.fn()

vi.mock('../services/anomalyService', () => ({
  anomalyService: {
    getAnomalies: vi.fn(),
    acknowledgeAnomaly: vi.fn(),
    resolveAnomaly: vi.fn(),
  },
}))

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}))

describe('AnomalyDetectionModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    anomalyService.getAnomalies.mockResolvedValue({
      total_anomalies_detected: 1,
      critical_count: 1,
      warning_count: 0,
      unresolved_count: 1,
      insights: [],
      items: [
        {
          id: 'event-1',
          severity: 'Critical',
          anomaly_type: 'Sales Spike',
          status: 'open',
          anomaly_score: 0.95,
          title: 'Unusual sales activity',
          description: 'Sales activity is significantly above the expected range.',
        },
      ],
    })
  })

  it('requests the selected severity when the user changes the filter', async () => {
    render(<AnomalyDetectionModule />)

    await waitFor(() => {
      expect(anomalyService.getAnomalies).toHaveBeenCalledWith(
        null,
        null,
        0.05
      )
    })

    fireEvent.click(screen.getByRole('button', { name: 'critical' }))

    await waitFor(() => {
      expect(anomalyService.getAnomalies).toHaveBeenLastCalledWith(
        null,
        'critical',
        0.05
      )
    })

    expect(
      screen.getByText('Unusual sales activity')
    ).toBeInTheDocument()
  })
})
