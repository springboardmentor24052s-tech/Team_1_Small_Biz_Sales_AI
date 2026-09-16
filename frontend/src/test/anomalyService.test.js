import { beforeEach, describe, expect, it, vi } from 'vitest'
import { anomalyService } from '../services/anomalyService'
import { request } from '../api/client'

vi.mock('../api/client', () => ({
  request: vi.fn(),
}))

describe('anomalyService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    request.mockResolvedValue({ status: 'ok' })
  })

  it('fetches anomalies with tenant, severity, and contamination filters', async () => {
    await anomalyService.getAnomalies('tenant-1', 'critical', 0.1)

    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('/anomalies?')
    )

    const calledPath = request.mock.calls[0][0]

    expect(calledPath).toContain('tenant_id=tenant-1')
    expect(calledPath).toContain('severity=critical')
    expect(calledPath).toContain('contamination=0.1')
  })

  it('fetches anomalies without optional tenant and severity filters', async () => {
    await anomalyService.getAnomalies()

    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('/anomalies?')
    )

    const calledPath = request.mock.calls[0][0]

    expect(calledPath).toContain('contamination=0.05')
    expect(calledPath).not.toContain('tenant_id=')
    expect(calledPath).not.toContain('severity=')
  })

  it('acknowledges an anomaly with notes', async () => {
    await anomalyService.acknowledgeAnomaly('event-123', 'Reviewed by owner')

    expect(request).toHaveBeenCalledWith(
      '/anomalies/event-123/acknowledge',
      {
        method: 'POST',
        body: JSON.stringify({ notes: 'Reviewed by owner' }),
      }
    )
  })

  it('resolves an anomaly with notes', async () => {
    await anomalyService.resolveAnomaly('event-456', 'Issue fixed')

    expect(request).toHaveBeenCalledWith(
      '/anomalies/event-456/resolve',
      {
        method: 'POST',
        body: JSON.stringify({ notes: 'Issue fixed' }),
      }
    )
  })
})
