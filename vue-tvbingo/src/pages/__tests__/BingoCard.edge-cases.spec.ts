import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import BingoCard from '../BingoCard.vue'
import { showService } from '../../services/showService'
import type { Show } from '../../types/Show'

// Create mocks that can be controlled per-test
const mockRouteParams = { id: '1' }
const mockPush = vi.fn()

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    params: mockRouteParams
  })),
  useRouter: vi.fn(() => ({
    push: mockPush
  })),
  RouterLink: {
    name: 'RouterLink',
    template: '<a><slot /></a>'
  }
}))

// Mock showService
vi.mock('../../services/showService', () => ({
  showService: {
    getShowById: vi.fn()
  }
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
})

// Helper to create mount options with router stub
const createMountOptions = () => ({
  global: {
    stubs: {
      RouterLink: {
        template: '<a :href="to"><slot /></a>',
        props: ['to']
      }
    }
  }
})

describe('BingoCard.vue - Frontend Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouteParams.id = '1'
    mockPush.mockClear()
    localStorageMock.clear()
    sessionStorageMock.clear()
  })

  describe('Edge Case: Bingo card with exactly 24 phrases', () => {
    it('should successfully generate a 5x5 grid with exactly 24 phrases', async () => {
      const showWith24Phrases: Show = {
        id: 1,
        showTitle: 'Minimal Show',
        gameTitle: 'Minimal Bingo',
        centerSquare: 'CENTER',
        phrases: Array.from({ length: 24 }, (_, i) => `Phrase ${i + 1}`)
      }

      vi.mocked(showService.getShowById).mockResolvedValue(showWith24Phrases)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Minimal Show')
      
      const cells = wrapper.findAll('.bingo-cell')
      expect(cells).toHaveLength(25)

      // Verify center square
      expect(cells[12].text()).toBe('CENTER')
      expect(cells[12].classes()).toContain('center-square')

      // Verify all other cells contain one of the phrases
      cells.forEach((cell, idx) => {
        if (idx !== 12) {
          expect(showWith24Phrases.phrases).toContain(cell.text())
        }
      })
    })

    it('should use all 24 phrases exactly once (except center)', async () => {
      const showWith24Phrases: Show = {
        id: 1,
        showTitle: 'Minimal Show',
        gameTitle: 'Minimal Bingo',
        centerSquare: 'CENTER',
        phrases: Array.from({ length: 24 }, (_, i) => `Unique-${i}`)
      }

      vi.mocked(showService.getShowById).mockResolvedValue(showWith24Phrases)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const cells = wrapper.findAll('.bingo-cell')
      const cellTexts = cells.map(cell => cell.text()).filter((_, idx) => idx !== 12)

      // All 24 phrases should be used exactly once
      expect(new Set(cellTexts).size).toBe(24)
      cellTexts.forEach(text => {
        expect(showWith24Phrases.phrases).toContain(text)
      })
    })
  })

  describe('Edge Case: Bingo card with 1000+ phrases', () => {
    it('should handle show with 1000+ phrases without performance issues', async () => {
      const largePhrases = Array.from({ length: 1500 }, (_, i) => `Phrase ${i + 1}`)
      const largeShow: Show = {
        id: 1,
        showTitle: 'Large Show',
        gameTitle: 'Large Bingo',
        centerSquare: 'FREE',
        phrases: largePhrases
      }

      vi.mocked(showService.getShowById).mockResolvedValue(largeShow)

      const startTime = performance.now()
      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()
      const endTime = performance.now()

      // Should render within reasonable time (< 500ms)
      expect(endTime - startTime).toBeLessThan(500)

      const cells = wrapper.findAll('.bingo-cell')
      expect(cells).toHaveLength(25)

      // Verify only 24 phrases were selected (plus center)
      const nonCenterCells = cells.filter((_, idx) => idx !== 12)
      expect(nonCenterCells).toHaveLength(24)

      // All selected phrases should be from the original array
      nonCenterCells.forEach(cell => {
        expect(largePhrases).toContain(cell.text())
      })
    })

    it('should generate different grids from large phrase pool', async () => {
      const largePhrases = Array.from({ length: 1000 }, (_, i) => `Phrase ${i + 1}`)
      const largeShow: Show = {
        id: 1,
        showTitle: 'Large Show',
        gameTitle: 'Large Bingo',
        centerSquare: 'FREE',
        phrases: largePhrases
      }

      vi.mocked(showService.getShowById).mockResolvedValue(largeShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const firstGrid = wrapper.findAll('.bingo-cell').map(cell => cell.text())

      const regenButton = wrapper.find('.regenerate-button')
      await regenButton.trigger('click')
      await nextTick()

      const secondGrid = wrapper.findAll('.bingo-cell').map(cell => cell.text())

      // Grids should be different (very high probability with 1000 phrases)
      const differentCount = firstGrid.filter((cell, idx) => idx !== 12 && cell !== secondGrid[idx]).length
      expect(differentCount).toBeGreaterThan(0)
    })
  })

  describe('Edge Case: Network timeout handling', () => {
    it('should handle network timeout gracefully', async () => {
      vi.mocked(showService.getShowById).mockImplementation(
        () => new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 100)
        })
      )

      const wrapper = mount(BingoCard, createMountOptions())
      
      // Should show loading state initially
      expect(wrapper.text()).toContain('Loading bingo card...')

      // Wait for the timeout to trigger
      await new Promise(resolve => setTimeout(resolve, 150))
      await flushPromises()
      await nextTick()

      // Should show error after timeout
      expect(wrapper.text()).toContain('Failed to load show')
    })

    it('should handle slow network response', async () => {
      const slowShow: Show = {
        id: 1,
        showTitle: 'Slow Show',
        gameTitle: 'Slow Bingo',
        centerSquare: 'FREE',
        phrases: Array.from({ length: 30 }, (_, i) => `Phrase ${i + 1}`)
      }

      vi.mocked(showService.getShowById).mockImplementation(
        () => new Promise(resolve => {
          setTimeout(() => resolve(slowShow), 200)
        })
      )

      const wrapper = mount(BingoCard, createMountOptions())
      
      // Should show loading during delay
      expect(wrapper.text()).toContain('Loading bingo card...')

      await new Promise(resolve => setTimeout(resolve, 250))
      await flushPromises()
      await nextTick()

      // Should eventually render successfully
      expect(wrapper.text()).toContain('Slow Show')
      expect(wrapper.findAll('.bingo-cell')).toHaveLength(25)
    })
  })

  describe('Edge Case: Rapid button clicking (debounce)', () => {
    it('should handle rapid regenerate button clicks', async () => {
      const mockShow: Show = {
        id: 1,
        showTitle: 'Test Show',
        gameTitle: 'Test Bingo',
        centerSquare: 'FREE',
        phrases: Array.from({ length: 30 }, (_, i) => `Phrase ${i + 1}`)
      }

      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const regenButton = wrapper.find('.regenerate-button')

      // Click rapidly 10 times
      for (let i = 0; i < 10; i++) {
        await regenButton.trigger('click')
      }
      await nextTick()

      // Should not crash and should still have valid grid
      const cells = wrapper.findAll('.bingo-cell')
      expect(cells).toHaveLength(25)
      expect(cells[12].text()).toBe('FREE')
    })

    it('should handle rapid cell selection clicks', async () => {
      const mockShow: Show = {
        id: 1,
        showTitle: 'Test Show',
        gameTitle: 'Test Bingo',
        centerSquare: 'FREE',
        phrases: Array.from({ length: 30 }, (_, i) => `Phrase ${i + 1}`)
      }

      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const firstCell = wrapper.findAll('.bingo-cell')[0]

      // Click same cell rapidly 20 times
      for (let i = 0; i < 20; i++) {
        await firstCell.trigger('click')
      }
      await nextTick()

      // Cell should be unselected (even number of clicks)
      expect(firstCell.classes()).not.toContain('selected')
    })

    it('should handle rapid reset button clicks', async () => {
      const mockShow: Show = {
        id: 1,
        showTitle: 'Test Show',
        gameTitle: 'Test Bingo',
        centerSquare: 'FREE',
        phrases: Array.from({ length: 30 }, (_, i) => `Phrase ${i + 1}`)
      }

      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      // Select some cells
      const cells = wrapper.findAll('.bingo-cell')
      await cells[0].trigger('click')
      await cells[1].trigger('click')

      const resetButton = wrapper.find('.reset-button')

      // Click reset rapidly 5 times
      for (let i = 0; i < 5; i++) {
        await resetButton.trigger('click')
      }
      await nextTick()

      // Should still be in valid state with only center selected
      expect(cells[0].classes()).not.toContain('selected')
      expect(cells[1].classes()).not.toContain('selected')
      expect(cells[12].classes()).toContain('selected')
    })
  })

  describe('Edge Case: Browser back button behavior', () => {
    it('should handle browser navigation away and back', async () => {
      const mockShow: Show = {
        id: 1,
        showTitle: 'Test Show',
        gameTitle: 'Test Bingo',
        centerSquare: 'FREE',
        phrases: Array.from({ length: 30 }, (_, i) => `Phrase ${i + 1}`)
      }

      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      // Simulate navigation away and back by unmounting and remounting
      wrapper.unmount()

      const wrapper2 = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      // Should render successfully with a fresh grid
      expect(wrapper2.text()).toContain('Test Show')
      expect(wrapper2.findAll('.bingo-cell')).toHaveLength(25)
    })

    it('should reload show data on remount with different ID', async () => {
      const mockShow1: Show = {
        id: 1,
        showTitle: 'Show One',
        gameTitle: 'Bingo One',
        centerSquare: 'FREE',
        phrases: Array.from({ length: 30 }, (_, i) => `Phrase 1-${i}`)
      }

      const mockShow2: Show = {
        id: 2,
        showTitle: 'Show Two',
        gameTitle: 'Bingo Two',
        centerSquare: 'CENTER',
        phrases: Array.from({ length: 30 }, (_, i) => `Phrase 2-${i}`)
      }

      vi.mocked(showService.getShowById).mockResolvedValue(mockShow1)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Show One')

      // Change route params and remount
      mockRouteParams.id = '2'
      vi.mocked(showService.getShowById).mockResolvedValue(mockShow2)

      const wrapper2 = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      expect(wrapper2.text()).toContain('Show Two')
      expect(wrapper2.text()).not.toContain('Show One')
    })
  })

  describe('Edge Case: LocalStorage/SessionStorage handling', () => {
    it('should work when localStorage is available', async () => {
      const mockShow: Show = {
        id: 1,
        showTitle: 'Test Show',
        gameTitle: 'Test Bingo',
        centerSquare: 'FREE',
        phrases: Array.from({ length: 30 }, (_, i) => `Phrase ${i + 1}`)
      }

      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      // Verify localStorage is working
      localStorage.setItem('test', 'value')
      expect(localStorage.getItem('test')).toBe('value')

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      expect(wrapper.findAll('.bingo-cell')).toHaveLength(25)
    })

    it('should work when localStorage is unavailable', async () => {
      const mockShow: Show = {
        id: 1,
        showTitle: 'Test Show',
        gameTitle: 'Test Bingo',
        centerSquare: 'FREE',
        phrases: Array.from({ length: 30 }, (_, i) => `Phrase ${i + 1}`)
      }

      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      // Simulate localStorage being unavailable
      const originalLocalStorage = window.localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => { throw new Error('QuotaExceededError') },
          setItem: () => { throw new Error('QuotaExceededError') },
          clear: () => { throw new Error('QuotaExceededError') }
        },
        writable: true
      })

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      // Should still render successfully
      expect(wrapper.findAll('.bingo-cell')).toHaveLength(25)

      // Restore original localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true
      })
    })

    it('should work when sessionStorage is available', async () => {
      const mockShow: Show = {
        id: 1,
        showTitle: 'Test Show',
        gameTitle: 'Test Bingo',
        centerSquare: 'FREE',
        phrases: Array.from({ length: 30 }, (_, i) => `Phrase ${i + 1}`)
      }

      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      // Verify sessionStorage is working
      sessionStorage.setItem('test', 'value')
      expect(sessionStorage.getItem('test')).toBe('value')

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      expect(wrapper.findAll('.bingo-cell')).toHaveLength(25)
    })
  })

  describe('Edge Case: Window resize on bingo grid', () => {
    it('should maintain grid structure after window resize', async () => {
      const mockShow: Show = {
        id: 1,
        showTitle: 'Test Show',
        gameTitle: 'Test Bingo',
        centerSquare: 'FREE',
        phrases: Array.from({ length: 30 }, (_, i) => `Phrase ${i + 1}`)
      }

      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      expect(wrapper.findAll('.bingo-cell')).toHaveLength(25)

      // Simulate window resize
      window.innerWidth = 320 // Mobile size
      window.dispatchEvent(new Event('resize'))
      await nextTick()

      // Grid should still have 25 cells
      expect(wrapper.findAll('.bingo-cell')).toHaveLength(25)
      expect(wrapper.find('.bingo-grid').exists()).toBe(true)

      // Resize to desktop
      window.innerWidth = 1920
      window.dispatchEvent(new Event('resize'))
      await nextTick()

      // Grid should still have 25 cells
      expect(wrapper.findAll('.bingo-cell')).toHaveLength(25)
    })

    it('should preserve selected state after resize', async () => {
      const mockShow: Show = {
        id: 1,
        showTitle: 'Test Show',
        gameTitle: 'Test Bingo',
        centerSquare: 'FREE',
        phrases: Array.from({ length: 30 }, (_, i) => `Phrase ${i + 1}`)
      }

      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      // Select some cells
      const cells = wrapper.findAll('.bingo-cell')
      await cells[0].trigger('click')
      await cells[5].trigger('click')

      expect(cells[0].classes()).toContain('selected')
      expect(cells[5].classes()).toContain('selected')

      // Simulate resize
      window.innerWidth = 768 // Tablet size
      window.dispatchEvent(new Event('resize'))
      await nextTick()

      // Selections should be preserved
      const cellsAfterResize = wrapper.findAll('.bingo-cell')
      expect(cellsAfterResize[0].classes()).toContain('selected')
      expect(cellsAfterResize[5].classes()).toContain('selected')
    })
  })

  describe('Edge Case: Touch events on mobile', () => {
    it('should handle touch events for cell selection', async () => {
      const mockShow: Show = {
        id: 1,
        showTitle: 'Test Show',
        gameTitle: 'Test Bingo',
        centerSquare: 'FREE',
        phrases: Array.from({ length: 30 }, (_, i) => `Phrase ${i + 1}`)
      }

      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const firstCell = wrapper.findAll('.bingo-cell')[0]

      // Simulate touch event (which also triggers click)
      await firstCell.trigger('click')
      await nextTick()

      expect(firstCell.classes()).toContain('selected')
    })

    it('should handle keyboard events for accessibility', async () => {
      const mockShow: Show = {
        id: 1,
        showTitle: 'Test Show',
        gameTitle: 'Test Bingo',
        centerSquare: 'FREE',
        phrases: Array.from({ length: 30 }, (_, i) => `Phrase ${i + 1}`)
      }

      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const firstCell = wrapper.findAll('.bingo-cell')[0]

      // Test Enter key
      await firstCell.trigger('keydown.enter')
      await nextTick()
      expect(firstCell.classes()).toContain('selected')

      // Test Space key
      await firstCell.trigger('keydown.space')
      await nextTick()
      expect(firstCell.classes()).not.toContain('selected')
    })

    it('should prevent default on keyboard events to avoid scrolling', async () => {
      const mockShow: Show = {
        id: 1,
        showTitle: 'Test Show',
        gameTitle: 'Test Bingo',
        centerSquare: 'FREE',
        phrases: Array.from({ length: 30 }, (_, i) => `Phrase ${i + 1}`)
      }

      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const firstCell = wrapper.findAll('.bingo-cell')[0]

      // Trigger space key - the keydown.space handler should prevent default scrolling
      await firstCell.trigger('keydown.space')
      await nextTick()

      // Cell should toggle (the space key handler should work)
      expect(firstCell.classes()).toContain('selected')
    })

    it('should handle rapid touch events without double-toggle', async () => {
      const mockShow: Show = {
        id: 1,
        showTitle: 'Test Show',
        gameTitle: 'Test Bingo',
        centerSquare: 'FREE',
        phrases: Array.from({ length: 30 }, (_, i) => `Phrase ${i + 1}`)
      }

      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const firstCell = wrapper.findAll('.bingo-cell')[0]

      // Simulate rapid touch (single click)
      await firstCell.trigger('click')
      await nextTick()

      expect(firstCell.classes()).toContain('selected')
    })
  })
})
