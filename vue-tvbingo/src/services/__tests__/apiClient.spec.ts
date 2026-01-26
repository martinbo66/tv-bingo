import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ApiClient, ApiError } from '../apiClient'

describe('ApiError', () => {
  it('should create ApiError with message, status, and data', () => {
    const error = new ApiError('Not Found', 404, { detail: 'Resource missing' })

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('ApiError')
    expect(error.message).toBe('Not Found')
    expect(error.status).toBe(404)
    expect(error.data).toEqual({ detail: 'Resource missing' })
  })

  it('should create ApiError without data', () => {
    const error = new ApiError('Server Error', 500)

    expect(error.message).toBe('Server Error')
    expect(error.status).toBe(500)
    expect(error.data).toBeUndefined()
  })

  it('should have correct name property', () => {
    const error = new ApiError('Test', 400)
    expect(error.name).toBe('ApiError')
  })
})

describe('ApiClient', () => {
  let apiClient: ApiClient
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    apiClient = new ApiClient('http://localhost:8080')
    fetchMock = vi.fn()
    global.fetch = fetchMock as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Constructor', () => {
    it('should create ApiClient with base URL', () => {
      const client = new ApiClient('http://api.example.com')
      expect(client).toBeInstanceOf(ApiClient)
    })

    it('should work with empty base URL', () => {
      const client = new ApiClient('')
      expect(client).toBeInstanceOf(ApiClient)
    })
  })

  describe('Successful Requests', () => {
    it('should make GET request and return JSON data', async () => {
      const mockData = { id: 1, name: 'Test' }
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockData
      })

      const result = await apiClient.request('/api/test')

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/api/test',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json'
          }
        })
      )
      expect(result).toEqual(mockData)
    })

    it('should make POST request with body', async () => {
      const mockData = { id: 1, name: 'Created' }
      const requestBody = { name: 'New Item' }

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockData
      })

      const result = await apiClient.request('/api/items', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/api/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json'
          }
        })
      )
      expect(result).toEqual(mockData)
    })

    it('should make PUT request', async () => {
      const mockData = { id: 1, name: 'Updated' }
      const requestBody = { name: 'Updated Item' }

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockData
      })

      const result = await apiClient.request('/api/items/1', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      })

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/api/items/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestBody)
        })
      )
      expect(result).toEqual(mockData)
    })

    it('should make DELETE request', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({})
      })

      const result = await apiClient.request('/api/items/1', {
        method: 'DELETE'
      })

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/api/items/1',
        expect.objectContaining({
          method: 'DELETE'
        })
      )
      expect(result).toEqual({})
    })

    it('should merge custom headers with default headers', async () => {
      const mockData = { success: true }
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockData
      })

      await apiClient.request('/api/test', {
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'value'
        }
      })

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/api/test',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token123',
            'X-Custom-Header': 'value'
          }
        })
      )
    })

    it('should handle empty response body', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => null
      })

      const result = await apiClient.request('/api/empty')
      expect(result).toBeNull()
    })

    it('should construct full URL correctly', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({})
      })

      await apiClient.request('/api/shows/123')

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/api/shows/123',
        expect.any(Object)
      )
    })
  })

  describe('Error Handling - HTTP Errors', () => {
    it('should throw ApiError on 404 Not Found', async () => {
      const errorData = { message: 'Resource not found' }
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => errorData
      })

      await expect(apiClient.request('/api/missing')).rejects.toThrow(ApiError)

      try {
        await apiClient.request('/api/missing')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        const apiError = error as ApiError
        expect(apiError.message).toBe('Not Found')
        expect(apiError.status).toBe(404)
        expect(apiError.data).toEqual(errorData)
      }
    })

    it('should throw ApiError on 400 Bad Request with validation errors', async () => {
      const validationErrors = {
        showTitle: 'Show title is required',
        phrases: 'Must have at least 24 phrases'
      }
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => validationErrors
      })

      await expect(apiClient.request('/api/shows', { method: 'POST' }))
        .rejects.toThrow(ApiError)

      try {
        await apiClient.request('/api/shows', { method: 'POST' })
      } catch (error) {
        const apiError = error as ApiError
        expect(apiError.status).toBe(400)
        expect(apiError.data).toEqual(validationErrors)
      }
    })

    it('should throw ApiError on 500 Internal Server Error', async () => {
      const errorData = { error: 'Internal server error' }
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => errorData
      })

      await expect(apiClient.request('/api/error')).rejects.toThrow(ApiError)

      try {
        await apiClient.request('/api/error')
      } catch (error) {
        const apiError = error as ApiError
        expect(apiError.status).toBe(500)
        expect(apiError.message).toBe('Internal Server Error')
      }
    })

    it('should throw ApiError on 401 Unauthorized', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Not authenticated' })
      })

      await expect(apiClient.request('/api/protected')).rejects.toThrow(ApiError)

      try {
        await apiClient.request('/api/protected')
      } catch (error) {
        const apiError = error as ApiError
        expect(apiError.status).toBe(401)
      }
    })

    it('should throw ApiError on 409 Conflict', async () => {
      const conflictData = { showTitle: 'Show title must be unique' }
      fetchMock.mockResolvedValue({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: async () => conflictData
      })

      await expect(apiClient.request('/api/shows', { method: 'POST' }))
        .rejects.toThrow(ApiError)

      try {
        await apiClient.request('/api/shows', { method: 'POST' })
      } catch (error) {
        const apiError = error as ApiError
        expect(apiError.status).toBe(409)
        expect(apiError.data).toEqual(conflictData)
      }
    })

    it('should handle error response with invalid JSON', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      await expect(apiClient.request('/api/bad-json')).rejects.toThrow(ApiError)

      try {
        await apiClient.request('/api/bad-json')
      } catch (error) {
        const apiError = error as ApiError
        expect(apiError.status).toBe(500)
        expect(apiError.data).toEqual({}) // Falls back to empty object
      }
    })
  })

  describe('Error Handling - Network Errors', () => {
    it('should throw ApiError with status 0 on network failure', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'))

      await expect(apiClient.request('/api/test')).rejects.toThrow(ApiError)

      try {
        await apiClient.request('/api/test')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        const apiError = error as ApiError
        expect(apiError.message).toBe('Network error')
        expect(apiError.status).toBe(0)
      }
    })

    it('should throw ApiError on fetch timeout', async () => {
      fetchMock.mockRejectedValue(new Error('Timeout'))

      await expect(apiClient.request('/api/slow')).rejects.toThrow(ApiError)

      try {
        await apiClient.request('/api/slow')
      } catch (error) {
        const apiError = error as ApiError
        expect(apiError.status).toBe(0)
      }
    })

    it('should throw ApiError on DNS failure', async () => {
      fetchMock.mockRejectedValue(new Error('DNS lookup failed'))

      await expect(apiClient.request('/api/test')).rejects.toThrow(ApiError)

      try {
        await apiClient.request('/api/test')
      } catch (error) {
        const apiError = error as ApiError
        expect(apiError.status).toBe(0)
        expect(apiError.message).toBe('Network error')
      }
    })

    it('should preserve ApiError when re-thrown', async () => {
      const originalError = new ApiError('Custom error', 418, { teapot: true })
      fetchMock.mockRejectedValue(originalError)

      await expect(apiClient.request('/api/test')).rejects.toThrow(ApiError)

      try {
        await apiClient.request('/api/test')
      } catch (error) {
        expect(error).toBe(originalError) // Same instance
        const apiError = error as ApiError
        expect(apiError.status).toBe(418)
        expect(apiError.data).toEqual({ teapot: true })
      }
    })
  })

  describe('TypeScript Generic Type Support', () => {
    it('should return typed response', async () => {
      interface TestResponse {
        id: number
        name: string
      }

      const mockData: TestResponse = { id: 1, name: 'Test' }
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockData
      })

      const result = await apiClient.request<TestResponse>('/api/test')

      // TypeScript should know this is TestResponse
      expect(result.id).toBe(1)
      expect(result.name).toBe('Test')
    })

    it('should handle array responses', async () => {
      const mockData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockData
      })

      const result = await apiClient.request<Array<{ id: number, name: string }>>('/api/items')

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle endpoint without leading slash', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({})
      })

      await apiClient.request('api/test')

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080api/test',
        expect.any(Object)
      )
    })

    it('should handle empty base URL', async () => {
      const client = new ApiClient('')
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({})
      })

      await client.request('/api/test')

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/test',
        expect.any(Object)
      )
    })

    it('should handle base URL with trailing slash', async () => {
      const client = new ApiClient('http://localhost:8080/')
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({})
      })

      await client.request('/api/test')

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080//api/test',
        expect.any(Object)
      )
    })
  })
})
