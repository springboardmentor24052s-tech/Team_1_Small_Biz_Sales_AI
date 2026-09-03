import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ReportsModule } from '../components/modules/ReportsModule'

const mockApi = vi.fn()

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    api: mockApi,
    currentRole: { id: 'owner' },
    access: {
      modules: [
        {
          code: 'forecasts',
          actions: ['export'],
        },
      ],
    },
  }),
}))

describe('ReportsModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an error message when the report API fails', async () => {
    mockApi.mockRejectedValue(new Error('Unable to connect to report service.'))

    render(<ReportsModule />)

    await waitFor(() => {
      expect(
        screen.getByText('Report generation failed:')
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText('Unable to connect to report service.')
    ).toBeInTheDocument()
  })
})
