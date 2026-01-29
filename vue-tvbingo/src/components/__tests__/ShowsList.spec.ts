import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import ShowsList from '../ShowsList.vue'
import { showService } from '../../services/showService'
import type { Show } from '../../types/Show'

// Create mocks
const mockPush = vi.fn()

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush
  })),
  RouterLink: {
    name: 'RouterLink',
    template: '<a :to="to"><slot /></a>',
    props: ['to']
  }
}))

// Mock showService
vi.mock('../../services/showService', () => ({
  showService: {
    getShows: vi.fn(),
    deleteShow: vi.fn()
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
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock window.confirm
const originalConfirm = window.confirm
window.confirm = vi.fn(() => true)

// Helper to create mount options
const createMountOptions = () => ({
  global: {
    stubs: {
      RouterLink: {
        template: '<a :to="to"><slot /></a>',
        props: ['to']
      }
    }
  }
})

describe('ShowsList.vue - Phase 2 Integration Tests', () => {
  const mockShows: Show[] = [
    {
      id: 1,
      showTitle: 'The Office',
      gameTitle: 'Office Bingo',
      centerSquare: 'FREE',
      phrases: Array(30).fill('phrase')
    },
    {
      id: 2,
      showTitle: 'Toddlers and Tiaras',
      gameTitle: 'Blingo',
      centerSquare: 'FREE',
      phrases: Array(25).fill('phrase')
    },
    {
      id: 3,
      showTitle: 'North Woods Law',
      gameTitle: 'On Patrol',
      centerSquare: 'FREE',
      phrases: Array(27).fill('phrase')
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockPush.mockClear()
    vi.mocked(showService.getShows).mockResolvedValue(mockShows)
  })

  afterEach(() => {
    window.confirm = originalConfirm
  })

  describe('View Toggle - Switching views maintains data state', () => {
    it('should maintain show data when switching from grid to list view', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Verify grid view shows all 3 shows
      const shows = wrapper.findAll('.show-card')
      expect(shows.length).toBe(3)
      expect(shows[0].text()).toContain('North Woods Law')
      expect(shows[1].text()).toContain('The Office')
      expect(shows[2].text()).toContain('Toddlers and Tiaras')

      // Switch to list view
      const viewBtns = wrapper.findAll('.view-toggle-btn')
      await viewBtns[1].trigger('click')
      await nextTick()

      // Verify list view shows same 3 shows in same order
      const listRows = wrapper.findAll('.list-row')
      expect(listRows.length).toBe(3)
      expect(listRows[0].text()).toContain('North Woods Law')
      expect(listRows[1].text()).toContain('The Office')
      expect(listRows[2].text()).toContain('Toddlers and Tiaras')
    })

    it('should maintain show data when switching from list to grid view', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Switch to list view first
      const viewBtns = wrapper.findAll('.view-toggle-btn')
      await viewBtns[1].trigger('click')
      await nextTick()

      // Verify list view
      const listRows = wrapper.findAll('.list-row')
      expect(listRows.length).toBe(3)

      // Switch back to grid view
      await viewBtns[0].trigger('click')
      await nextTick()

      // Verify grid view shows same data
      const cards = wrapper.findAll('.show-card')
      expect(cards.length).toBe(3)
      expect(cards[0].text()).toContain('North Woods Law')
      expect(cards[1].text()).toContain('The Office')
      expect(cards[2].text()).toContain('Toddlers and Tiaras')
    })

    it('should maintain phrase counts in both views', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Check grid view phrase counts
      const cards = wrapper.findAll('.show-card')
      expect(cards[0].text()).toContain('27 phrases')
      expect(cards[1].text()).toContain('30 phrases')
      expect(cards[2].text()).toContain('25 phrases')

      // Switch to list view
      const viewBtns = wrapper.findAll('.view-toggle-btn')
      await viewBtns[1].trigger('click')
      await nextTick()

      // Check list view phrase counts
      const listRows = wrapper.findAll('.list-row')
      expect(listRows[0].text()).toContain('27')
      expect(listRows[1].text()).toContain('30')
      expect(listRows[2].text()).toContain('25')
    })

    it('should maintain complete indicators in both views', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Check grid view complete indicators
      const cards = wrapper.findAll('.show-card')
      expect(cards[0].find('.complete-indicator').exists()).toBe(true) // 27 phrases
      expect(cards[1].find('.complete-indicator').exists()).toBe(true) // 30 phrases
      expect(cards[2].find('.complete-indicator').exists()).toBe(true) // 25 phrases

      // Switch to list view
      const viewBtns = wrapper.findAll('.view-toggle-btn')
      await viewBtns[1].trigger('click')
      await nextTick()

      // Check list view complete indicators
      const listRows = wrapper.findAll('.list-row')
      expect(listRows[0].find('.complete-indicator-list').exists()).toBe(true)
      expect(listRows[1].find('.complete-indicator-list').exists()).toBe(true)
      expect(listRows[2].find('.complete-indicator-list').exists()).toBe(true)
    })
  })

  describe('View Preference Persistence - Sorting persists across page reloads', () => {
    it('should persist grid view preference in localStorage when toggled', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Grid view should be default (no localStorage entry needed on mount)
      const gridBtn = wrapper.findAll('.view-toggle-btn')[0]
      expect(gridBtn.attributes('aria-pressed')).toBe('true')

      // Switch to list then back to grid to trigger save
      const listBtn = wrapper.findAll('.view-toggle-btn')[1]
      await listBtn.trigger('click')
      await nextTick()

      await gridBtn.trigger('click')
      await nextTick()

      // Now localStorage should have grid
      const stored = localStorageMock.getItem('tvBingo.viewPreferences')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!).viewMode).toBe('grid')
    })

    it('should persist list view preference in localStorage', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Switch to list view
      const viewBtns = wrapper.findAll('.view-toggle-btn')
      await viewBtns[1].trigger('click')
      await nextTick()

      // Verify localStorage updated
      const stored = localStorageMock.getItem('tvBingo.viewPreferences')
      expect(stored).toContain('list')
      expect(JSON.parse(stored!).viewMode).toBe('list')
    })

    it('should restore list view preference on mount', async () => {
      // Set list view in localStorage before mounting
      localStorageMock.setItem('tvBingo.viewPreferences', JSON.stringify({ viewMode: 'list' }))

      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Should render list view
      expect(wrapper.find('.shows-list-view').exists()).toBe(true)
      expect(wrapper.find('.shows-grid').exists()).toBe(false)

      // List view button should be pressed
      const listBtn = wrapper.findAll('.view-toggle-btn')[1]
      expect(listBtn.attributes('aria-pressed')).toBe('true')
    })

    it('should restore grid view preference on mount', async () => {
      // Set grid view in localStorage before mounting
      localStorageMock.setItem('tvBingo.viewPreferences', JSON.stringify({ viewMode: 'grid' }))

      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Should render grid view
      expect(wrapper.find('.shows-grid').exists()).toBe(true)
      expect(wrapper.find('.shows-list-view').exists()).toBe(false)

      // Grid view button should be pressed
      const gridBtn = wrapper.findAll('.view-toggle-btn')[0]
      expect(gridBtn.attributes('aria-pressed')).toBe('true')
    })

    it('should handle corrupted localStorage gracefully', async () => {
      // Set invalid JSON in localStorage
      localStorageMock.setItem('tvBingo.viewPreferences', 'invalid json')

      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Should default to grid view
      expect(wrapper.find('.shows-grid').exists()).toBe(true)
      const gridBtn = wrapper.findAll('.view-toggle-btn')[0]
      expect(gridBtn.attributes('aria-pressed')).toBe('true')
    })
  })

  describe('Edit/Delete work in both views', () => {
    it('should navigate to edit page from grid view', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Click edit button on first show
      const cards = wrapper.findAll('.show-card')
      const editBtn = cards[0].find('.edit-btn')
      await editBtn.trigger('click')
      await nextTick()

      // Should navigate to edit page
      expect(mockPush).toHaveBeenCalledWith('/show/3/edit') // ID 3 is North Woods Law (first in sorted list)
    })

    it('should navigate to edit page from list view', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Switch to list view
      const viewBtns = wrapper.findAll('.view-toggle-btn')
      await viewBtns[1].trigger('click')
      await nextTick()

      // Click edit button on first show
      const listRows = wrapper.findAll('.list-row')
      const editBtn = listRows[0].find('.edit-btn')
      await editBtn.trigger('click')
      await nextTick()

      // Should navigate to edit page
      expect(mockPush).toHaveBeenCalledWith('/show/3/edit')
    })

    it('should delete show from grid view', async () => {
      vi.mocked(showService.deleteShow).mockResolvedValue(undefined)
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Click delete button on first show
      const cards = wrapper.findAll('.show-card')
      const deleteBtn = cards[0].find('.delete-btn')
      await deleteBtn.trigger('click')
      await nextTick()

      // Should show confirmation
      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this show?')

      // Should call delete service
      expect(showService.deleteShow).toHaveBeenCalledWith(3)

      // Should refresh shows
      await flushPromises()
      expect(showService.getShows).toHaveBeenCalledTimes(2) // Initial load + after delete
    })

    it('should delete show from list view', async () => {
      vi.mocked(showService.deleteShow).mockResolvedValue(undefined)
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Switch to list view
      const viewBtns = wrapper.findAll('.view-toggle-btn')
      await viewBtns[1].trigger('click')
      await nextTick()

      // Click delete button on first show
      const listRows = wrapper.findAll('.list-row')
      const deleteBtn = listRows[0].find('.delete-btn')
      await deleteBtn.trigger('click')
      await nextTick()

      // Should show confirmation
      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this show?')

      // Should call delete service
      expect(showService.deleteShow).toHaveBeenCalledWith(3)

      // Should refresh shows
      await flushPromises()
      expect(showService.getShows).toHaveBeenCalledTimes(2)
    })

    it('should not delete show if user cancels confirmation in grid view', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const cards = wrapper.findAll('.show-card')
      const deleteBtn = cards[0].find('.delete-btn')
      await deleteBtn.trigger('click')
      await nextTick()

      // Should show confirmation
      expect(confirmSpy).toHaveBeenCalled()

      // Should NOT call delete service
      expect(showService.deleteShow).not.toHaveBeenCalled()

      // Should NOT refresh shows
      expect(showService.getShows).toHaveBeenCalledTimes(1) // Only initial load
    })

    it('should not delete show if user cancels confirmation in list view', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Switch to list view
      const viewBtns = wrapper.findAll('.view-toggle-btn')
      await viewBtns[1].trigger('click')
      await nextTick()

      const listRows = wrapper.findAll('.list-row')
      const deleteBtn = listRows[0].find('.delete-btn')
      await deleteBtn.trigger('click')
      await nextTick()

      // Should show confirmation
      expect(confirmSpy).toHaveBeenCalled()

      // Should NOT call delete service
      expect(showService.deleteShow).not.toHaveBeenCalled()
    })

    it('should prevent click event from bubbling to card in grid view', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const cards = wrapper.findAll('.show-card')
      const editBtn = cards[0].find('.edit-btn')
      await editBtn.trigger('click')
      await nextTick()

      // Should navigate to edit, not show detail
      expect(mockPush).toHaveBeenCalledWith('/show/3/edit')
      expect(mockPush).not.toHaveBeenCalledWith('/show/3')
    })

    it('should prevent click event from bubbling to row in list view', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Switch to list view
      const viewBtns = wrapper.findAll('.view-toggle-btn')
      await viewBtns[1].trigger('click')
      await nextTick()

      const listRows = wrapper.findAll('.list-row')
      const editBtn = listRows[0].find('.edit-btn')
      await editBtn.trigger('click')
      await nextTick()

      // Should navigate to edit, not show detail
      expect(mockPush).toHaveBeenCalledWith('/show/3/edit')
      expect(mockPush).not.toHaveBeenCalledWith('/show/3')
    })
  })

  describe('Alphabetical Sorting', () => {
    it('should sort shows alphabetically in grid view', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const cards = wrapper.findAll('.show-card')
      const titles = cards.map(card => card.find('h3').text())

      // Should be sorted alphabetically
      expect(titles[0]).toBe('North Woods Law')
      expect(titles[1]).toBe('The Office')
      expect(titles[2]).toBe('Toddlers and Tiaras')
    })

    it('should sort shows alphabetically in list view', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Switch to list view
      const viewBtns = wrapper.findAll('.view-toggle-btn')
      await viewBtns[1].trigger('click')
      await nextTick()

      const listRows = wrapper.findAll('.list-row')
      const titles = listRows.map(row => row.find('.show-title-text').text())

      // Should be sorted alphabetically
      expect(titles[0]).toBe('North Woods Law')
      expect(titles[1]).toBe('The Office')
      expect(titles[2]).toBe('Toddlers and Tiaras')
    })

    it('should maintain alphabetical sort when switching views', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Get order in grid view
      const cards = wrapper.findAll('.show-card')
      const gridTitles = cards.map(card => card.find('h3').text())

      // Switch to list view
      const viewBtns = wrapper.findAll('.view-toggle-btn')
      await viewBtns[1].trigger('click')
      await nextTick()

      // Get order in list view
      const listRows = wrapper.findAll('.list-row')
      const listTitles = listRows.map(row => row.find('.show-title-text').text())

      // Should be same order
      expect(gridTitles).toEqual(listTitles)
    })
  })
})

describe('ShowsList.vue - Search and Filter', () => {
  const mockShows: Show[] = [
    {
      id: 1,
      showTitle: 'The Office',
      gameTitle: 'Office Bingo',
      centerSquare: 'FREE',
      phrases: Array(8).fill('phrase') // 8 phrases - low
    },
    {
      id: 2,
      showTitle: 'Toddlers and Tiaras',
      gameTitle: 'Blingo',
      centerSquare: 'FREE',
      phrases: Array(15).fill('phrase') // 15 phrases - medium
    },
    {
      id: 3,
      showTitle: 'North Woods Law',
      gameTitle: 'On Patrol',
      centerSquare: 'FREE',
      phrases: Array(27).fill('phrase') // 27 phrases - complete
    },
    {
      id: 4,
      showTitle: 'The Bachelor',
      gameTitle: 'Rose Ceremony',
      centerSquare: 'FREE',
      phrases: Array(25).fill('phrase') // 25 phrases - complete
    },
    {
      id: 5,
      showTitle: 'Survivor',
      gameTitle: 'Immunity Challenge',
      centerSquare: 'FREE',
      phrases: Array(5).fill('phrase') // 5 phrases - low
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockPush.mockClear()
    vi.mocked(showService.getShows).mockResolvedValue(mockShows)
  })

  afterEach(() => {
    window.confirm = originalConfirm
  })

  describe('Search Functionality', () => {
    it('should render search input', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const searchInput = wrapper.find('.search-input')
      expect(searchInput.exists()).toBe(true)
      expect(searchInput.attributes('placeholder')).toContain('Search shows')
    })

    it('should filter shows by show title', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Initially all shows visible
      let cards = wrapper.findAll('.show-card')
      expect(cards.length).toBe(5)

      // Search for "Office"
      const searchInput = wrapper.find('.search-input')
      await searchInput.setValue('Office')
      await nextTick()

      cards = wrapper.findAll('.show-card')
      expect(cards.length).toBe(1)
      expect(cards[0].text()).toContain('The Office')
    })

    it('should filter shows by game title', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const searchInput = wrapper.find('.search-input')
      await searchInput.setValue('Blingo')
      await nextTick()

      const cards = wrapper.findAll('.show-card')
      expect(cards.length).toBe(1)
      expect(cards[0].text()).toContain('Toddlers and Tiaras')
    })

    it('should be case insensitive', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const searchInput = wrapper.find('.search-input')
      await searchInput.setValue('OFFICE')
      await nextTick()

      const cards = wrapper.findAll('.show-card')
      expect(cards.length).toBe(1)
      expect(cards[0].text()).toContain('The Office')
    })

    it('should show no results message when no matches', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const searchInput = wrapper.find('.search-input')
      await searchInput.setValue('Nonexistent Show')
      await nextTick()

      expect(wrapper.text()).toContain('No shows found')
      expect(wrapper.find('.no-results').exists()).toBe(true)
    })

    it('should show clear button when search has text', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // No clear button initially
      expect(wrapper.find('.clear-search-btn').exists()).toBe(false)

      // Type something
      const searchInput = wrapper.find('.search-input')
      await searchInput.setValue('Office')
      await nextTick()

      // Clear button should appear
      expect(wrapper.find('.clear-search-btn').exists()).toBe(true)
    })

    it('should clear search when clear button clicked', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const searchInput = wrapper.find('.search-input')
      await searchInput.setValue('Office')
      await nextTick()

      expect(wrapper.findAll('.show-card').length).toBe(1)

      const clearBtn = wrapper.find('.clear-search-btn')
      await clearBtn.trigger('click')
      await nextTick()

      expect((searchInput.element as HTMLInputElement).value).toBe('')
      expect(wrapper.findAll('.show-card').length).toBe(5)
    })

    it('should show results count', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Showing 5 of 5 shows')

      const searchInput = wrapper.find('.search-input')
      await searchInput.setValue('The')
      await nextTick()

      expect(wrapper.text()).toContain('Showing 2 of 5 shows')
    })
  })

  describe('Filter Functionality', () => {
    it('should render filter buttons', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const filterBtns = wrapper.findAll('.filter-btn')
      expect(filterBtns.length).toBeGreaterThan(0)
      expect(wrapper.text()).toContain('All')
      expect(wrapper.text()).toContain('<10')
      expect(wrapper.text()).toContain('10-24')
      expect(wrapper.text()).toContain('25+')
    })

    it('should filter shows with less than 10 phrases', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const filterBtns = wrapper.findAll('.filter-btn')
      const lowBtn = filterBtns.find(btn => btn.text().includes('<10'))

      await lowBtn!.trigger('click')
      await nextTick()

      const cards = wrapper.findAll('.show-card')
      expect(cards.length).toBe(2) // The Office (8) and Survivor (5)
    })

    it('should filter shows with 10-24 phrases', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const filterBtns = wrapper.findAll('.filter-btn')
      const mediumBtn = filterBtns.find(btn => btn.text().includes('10-24'))

      await mediumBtn!.trigger('click')
      await nextTick()

      const cards = wrapper.findAll('.show-card')
      expect(cards.length).toBe(1) // Toddlers and Tiaras (15)
      expect(cards[0].text()).toContain('Toddlers and Tiaras')
    })

    it('should filter shows with 25+ phrases', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const filterBtns = wrapper.findAll('.filter-btn')
      const completeBtn = filterBtns.find(btn => btn.text().includes('25+'))

      await completeBtn!.trigger('click')
      await nextTick()

      const cards = wrapper.findAll('.show-card')
      expect(cards.length).toBe(2) // North Woods Law (27) and The Bachelor (25)
    })

    it('should show all shows when All filter is selected', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // First apply a filter
      const filterBtns = wrapper.findAll('.filter-btn')
      const lowBtn = filterBtns.find(btn => btn.text().includes('<10'))
      await lowBtn!.trigger('click')
      await nextTick()

      expect(wrapper.findAll('.show-card').length).toBe(2)

      // Click All to reset
      const allBtn = filterBtns.find(btn => btn.text() === 'All')
      await allBtn!.trigger('click')
      await nextTick()

      expect(wrapper.findAll('.show-card').length).toBe(5)
    })

    it('should show active state on selected filter', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const filterBtns = wrapper.findAll('.filter-btn')
      const lowBtn = filterBtns.find(btn => btn.text().includes('<10'))

      expect(lowBtn!.classes()).not.toContain('active')

      await lowBtn!.trigger('click')
      await nextTick()

      expect(lowBtn!.classes()).toContain('active')
    })

    it('should show Clear All button when filters are active', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // No Clear All button initially
      expect(wrapper.find('.clear-filters-btn').exists()).toBe(false)

      // Apply filter
      const filterBtns = wrapper.findAll('.filter-btn')
      const lowBtn = filterBtns.find(btn => btn.text().includes('<10'))
      await lowBtn!.trigger('click')
      await nextTick()

      // Clear All button should appear
      expect(wrapper.find('.clear-filters-btn').exists()).toBe(true)
    })
  })

  describe('Combined Search and Filter', () => {
    it('should combine search and filter with AND logic', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Search for "The" - should get "The Office" and "The Bachelor"
      const searchInput = wrapper.find('.search-input')
      await searchInput.setValue('The')
      await nextTick()

      expect(wrapper.findAll('.show-card').length).toBe(2)

      // Apply complete filter (25+) - should only get "The Bachelor"
      const filterBtns = wrapper.findAll('.filter-btn')
      const completeBtn = filterBtns.find(btn => btn.text().includes('25+'))
      await completeBtn!.trigger('click')
      await nextTick()

      const cards = wrapper.findAll('.show-card')
      expect(cards.length).toBe(1)
      expect(cards[0].text()).toContain('The Bachelor')
    })

    it('should show clear all button when both search and filter are active', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const searchInput = wrapper.find('.search-input')
      await searchInput.setValue('The')
      await nextTick()

      const filterBtns = wrapper.findAll('.filter-btn')
      const lowBtn = filterBtns.find(btn => btn.text().includes('<10'))
      await lowBtn!.trigger('click')
      await nextTick()

      expect(wrapper.find('.clear-filters-btn').exists()).toBe(true)
    })

    it('should clear both search and filter when Clear All clicked', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const searchInput = wrapper.find('.search-input')
      await searchInput.setValue('Office')
      await nextTick()

      const filterBtns = wrapper.findAll('.filter-btn')
      const lowBtn = filterBtns.find(btn => btn.text().includes('<10'))
      await lowBtn!.trigger('click')
      await nextTick()

      expect(wrapper.findAll('.show-card').length).toBe(1)

      const clearAllBtn = wrapper.find('.clear-filters-btn')
      await clearAllBtn.trigger('click')
      await nextTick()

      expect((searchInput.element as HTMLInputElement).value).toBe('')
      expect(wrapper.findAll('.show-card').length).toBe(5)

      // All filter should be active
      const allBtn = filterBtns.find(btn => btn.text() === 'All')
      expect(allBtn!.classes()).toContain('active')
    })
  })

  describe('No Results State', () => {
    it('should show no results with clear filters CTA when filters active', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const searchInput = wrapper.find('.search-input')
      await searchInput.setValue('Nonexistent')
      await nextTick()

      const noResults = wrapper.find('.no-results')
      expect(noResults.exists()).toBe(true)
      expect(noResults.text()).toContain('No shows found')
      expect(noResults.text()).toContain('Try adjusting your search or filters')
      expect(wrapper.find('.clear-filters-cta').exists()).toBe(true)
    })

    it('should clear filters from no results CTA', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const searchInput = wrapper.find('.search-input')
      await searchInput.setValue('Nonexistent')
      await nextTick()

      const clearBtn = wrapper.find('.clear-filters-cta')
      await clearBtn.trigger('click')
      await nextTick()

      expect((searchInput.element as HTMLInputElement).value).toBe('')
      expect(wrapper.findAll('.show-card').length).toBe(5)
    })
  })

  describe('List View with Search and Filter', () => {
    it('should work with list view', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Switch to list view
      const viewBtns = wrapper.findAll('.view-toggle-btn')
      const listBtn = viewBtns[1] // Second button is list view
      await listBtn.trigger('click')
      await nextTick()

      // Apply search
      const searchInput = wrapper.find('.search-input')
      await searchInput.setValue('Office')
      await nextTick()

      const rows = wrapper.findAll('.list-row')
      expect(rows.length).toBe(1)
      expect(rows[0].text()).toContain('The Office')
    })

    it('should filter list view by phrase count', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Switch to list view
      const viewBtns = wrapper.findAll('.view-toggle-btn')
      await viewBtns[1].trigger('click')
      await nextTick()

      // Apply complete filter
      const filterBtns = wrapper.findAll('.filter-btn')
      const completeBtn = filterBtns.find(btn => btn.text().includes('25+'))
      await completeBtn!.trigger('click')
      await nextTick()

      const rows = wrapper.findAll('.list-row')
      expect(rows.length).toBe(2)
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should have keyboard shortcut hint in placeholder', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const searchInput = wrapper.find('.search-input')
      expect(searchInput.attributes('placeholder')).toContain('Ctrl/Cmd + K or /')
    })

    it('should clear search hint in clear button title', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const searchInput = wrapper.find('.search-input')
      await searchInput.setValue('test')
      await nextTick()

      const clearBtn = wrapper.find('.clear-search-btn')
      expect(clearBtn.attributes('title')).toContain('Esc')
    })

    it('should show view toggle keyboard shortcut in button title', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      const viewBtns = wrapper.findAll('.view-toggle-btn')
      expect(viewBtns[0].attributes('title')).toContain('Ctrl/Cmd + Shift + V')
    })
  })

  describe('Sorting with Filters', () => {
    it('should maintain alphabetical sort after filtering', async () => {
      const wrapper = mount(ShowsList, createMountOptions())
      await flushPromises()
      await nextTick()

      // Filter to get multiple shows
      const searchInput = wrapper.find('.search-input')
      await searchInput.setValue('The')
      await nextTick()

      const cards = wrapper.findAll('.show-card')
      const titles = cards.map(card => {
        const titleEl = card.find('h3')
        return titleEl.text()
      })

      // Should be alphabetically sorted
      expect(titles[0]).toBe('The Bachelor')
      expect(titles[1]).toBe('The Office')
    })
  })
})
