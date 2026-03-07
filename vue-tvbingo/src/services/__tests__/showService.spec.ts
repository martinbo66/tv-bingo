import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { showService } from '../showService'
import type { Show, CreateShowInput } from '../../types/Show'

// showService creates its ApiClient instance at module scope, so we mock fetch
// directly — the same approach used in apiClient.spec.ts.

const mockShow: Show = {
  id: 1,
  showTitle: 'The Office',
  gameTitle: 'Office Bingo',
  centerSquare: 'FREE',
  phrases: ['That is what she said', 'Bears. Beets. Battlestar Galactica.']
}

const mockShow2: Show = {
  id: 2,
  showTitle: 'Parks and Recreation',
  phrases: ['Treat yo self', 'Knope we can']
}

function mockFetchOk(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => data
  })
}

describe('showService', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.fetch = fetchMock as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getShows', () => {
    it('should GET /api/shows and return the show list', async () => {
      fetchMock = mockFetchOk([mockShow, mockShow2])
      global.fetch = fetchMock as never

      const result = await showService.getShows()

      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/shows'), expect.any(Object))
      expect(result).toEqual([mockShow, mockShow2])
    })

    it('should return an empty array when no shows exist', async () => {
      global.fetch = mockFetchOk([]) as never

      const result = await showService.getShows()

      expect(result).toEqual([])
    })
  })

  describe('getShowById', () => {
    it('should GET /api/shows/:id with the correct id', async () => {
      global.fetch = mockFetchOk(mockShow) as never

      const result = await showService.getShowById(1)

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/shows/1'), expect.any(Object))
      expect(result).toEqual(mockShow)
    })

    it('should use the provided id in the URL', async () => {
      global.fetch = mockFetchOk(mockShow2) as never

      await showService.getShowById(42)

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/shows/42'), expect.any(Object))
    })
  })

  describe('addShow', () => {
    it('should POST /api/shows with the serialized show', async () => {
      const input: CreateShowInput = {
        showTitle: 'New Show',
        phrases: ['Phrase one', 'Phrase two']
      }
      const created: Show = { id: 3, ...input }
      global.fetch = mockFetchOk(created) as never

      const result = await showService.addShow(input)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/shows'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(input)
        })
      )
      expect(result).toEqual(created)
    })

    it('should include optional fields in the request body when present', async () => {
      const input: CreateShowInput = {
        showTitle: 'Full Show',
        gameTitle: 'Full Bingo',
        centerSquare: 'FREE SPACE',
        phrases: ['One', 'Two']
      }
      global.fetch = mockFetchOk({ id: 4, ...input }) as never

      await showService.addShow(input)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/shows'),
        expect.objectContaining({ body: JSON.stringify(input) })
      )
    })
  })

  describe('updateShow', () => {
    it('should PUT /api/shows/:id with the serialized show', async () => {
      global.fetch = mockFetchOk(mockShow) as never

      const result = await showService.updateShow(mockShow)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/shows/${mockShow.id}`),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockShow)
        })
      )
      expect(result).toEqual(mockShow)
    })

    it('should derive the URL from the show id', async () => {
      const show: Show = { id: 99, showTitle: 'Updated', phrases: ['p'] }
      global.fetch = mockFetchOk(show) as never

      await showService.updateShow(show)

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/shows/99'), expect.anything())
    })
  })

  describe('deleteShow', () => {
    it('should DELETE /api/shows/:id', async () => {
      global.fetch = mockFetchOk({}) as never

      await showService.deleteShow(1)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/shows/1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('should use the provided id in the URL', async () => {
      global.fetch = mockFetchOk({}) as never

      await showService.deleteShow(55)

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/shows/55'), expect.anything())
    })
  })

  describe('searchShowsByTitle', () => {
    beforeEach(() => {
      global.fetch = mockFetchOk([mockShow, mockShow2]) as never
    })

    it('should return shows whose title matches the query', async () => {
      const result = await showService.searchShowsByTitle('office')

      expect(result).toEqual([mockShow])
    })

    it('should be case-insensitive', async () => {
      const result = await showService.searchShowsByTitle('PARKS')

      expect(result).toEqual([mockShow2])
    })

    it('should return multiple matches when the query matches more than one show', async () => {
      global.fetch = mockFetchOk([mockShow, mockShow2, { id: 3, showTitle: 'The Wire', phrases: [] }]) as never

      // 'the' matches 'The Office' and 'The Wire' but not 'Parks and Recreation'
      const result = await showService.searchShowsByTitle('the')

      expect(result).toHaveLength(2)
      expect(result.map(s => s.id)).toEqual([1, 3])
    })

    it('should return empty array when no shows match', async () => {
      const result = await showService.searchShowsByTitle('zzznomatch')

      expect(result).toEqual([])
    })

    it('should match on partial titles', async () => {
      const result = await showService.searchShowsByTitle('fice')

      expect(result).toEqual([mockShow])
    })

    it('should call GET /api/shows to fetch all shows before filtering', async () => {
      await showService.searchShowsByTitle('anything')

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/shows'), expect.any(Object))
    })
  })
})
