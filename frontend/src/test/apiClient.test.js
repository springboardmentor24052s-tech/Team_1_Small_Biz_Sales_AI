import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, request } from '../api/client'

describe('API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the JSON payload for a successful request', async () => {
    const payload = { status: 'ok' }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )

    const result = await request('/health')

    expect(result).toEqual(payload)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/health'),
      expect.objectContaining({
        headers: expect.any(Object),
      })
    )
  })

  it('adds the bearer token and JSON content type when a JSON body is sent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: 1 }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )

    await request('/sales', {
      token: 'test-token',
      method: 'POST',
      body: JSON.stringify({ amount: 100 }),
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/sales'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ amount: 100 }),
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      })
    )
  })

  it('throws ApiError with the API message for failed requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: 'Access denied',
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
    )

    await expect(request('/protected')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Access denied',
      status: 403,
    })

    await expect(request('/protected')).rejects.toBeInstanceOf(ApiError)
  })

  it('returns null for a 204 No Content response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 204,
        })
      )
    )

    const result = await request('/logout')

    expect(result).toBeNull()
  })
})
