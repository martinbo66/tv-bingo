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

describe('BingoCard.vue', () => {
  const mockShow: Show = {
    id: 1,
    showTitle: 'The Office',
    gameTitle: 'Office Bingo',
    centerSquare: "That's what she said",
    phrases: [
      'Dwight moment',
      'Jim prank',
      'Michael awkwardness',
      'Angela cat lady',
      'Kevin math fail',
      'Stanley crossword',
      'Pam art',
      'Ryan scheme',
      'Toby hate',
      'Creed weird',
      'Meredith chaos',
      'Oscar explains',
      'Andy sings',
      'Phyllis sass',
      'Darryl wisdom',
      'Kelly drama',
      'Jan appears',
      'David Wallace',
      'Conference room',
      'Pranks on Dwight',
      'Beets reference',
      'Schrute Farms',
      'Dunder Mifflin',
      'Scranton branch',
      'Extra phrase 1',
      'Extra phrase 2',
      'Extra phrase 3' // 27 total
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRouteParams.id = '1' // Reset to valid ID
    mockPush.mockClear()
  })

  describe('Loading and Error States', () => {
    it('should show loading state initially', async () => {
      vi.mocked(showService.getShowById).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Loading bingo card...')
    })

    it('should show error when show ID is invalid', async () => {
      mockRouteParams.id = 'invalid'

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Invalid show ID')
    })

    it('should show error when show not found', async () => {
      vi.mocked(showService.getShowById).mockResolvedValue(null as any)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Show not found')
    })

    it('should show error when show has less than 24 phrases', async () => {
      const showWithFewPhrases: Show = {
        ...mockShow,
        phrases: ['phrase1', 'phrase2', 'phrase3'] // Only 3 phrases
      }
      vi.mocked(showService.getShowById).mockResolvedValue(showWithFewPhrases)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('This show needs at least 24 phrases to create a bingo card')
      expect(wrapper.text()).toContain('Edit Show')
    })

    it('should navigate to edit when edit button clicked on error', async () => {
      const showWithFewPhrases: Show = {
        ...mockShow,
        phrases: ['phrase1', 'phrase2', 'phrase3']
      }
      vi.mocked(showService.getShowById).mockResolvedValue(showWithFewPhrases)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const editButton = wrapper.find('.edit-button')
      await editButton.trigger('click')

      expect(mockPush).toHaveBeenCalledWith('/show/1/edit')
    })
  })

  describe('Grid Generation', () => {
    it('should load show and generate bingo grid on mount', async () => {
      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      expect(showService.getShowById).toHaveBeenCalledWith(1)
      expect(wrapper.text()).toContain('The Office')

      const cells = wrapper.findAll('.bingo-cell')
      expect(cells).toHaveLength(25) // 5x5 grid
    })

    it('should place center square at index 12', async () => {
      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const cells = wrapper.findAll('.bingo-cell')
      const centerCell = cells[12]

      expect(centerCell.text()).toBe("That's what she said")
      expect(centerCell.classes()).toContain('center-square')
    })

    it('should use "FREE SPACE" when no centerSquare is provided', async () => {
      const showWithoutCenter: Show = {
        ...mockShow,
        centerSquare: undefined
      }
      vi.mocked(showService.getShowById).mockResolvedValue(showWithoutCenter)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const cells = wrapper.findAll('.bingo-cell')
      expect(cells[12].text()).toBe('FREE SPACE')
    })

    it('should use exactly 24 phrases plus center square for 25 cells', async () => {
      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const cells = wrapper.findAll('.bingo-cell')
      expect(cells).toHaveLength(25)

      // All cells should have text
      cells.forEach(cell => {
        expect(cell.text()).toBeTruthy()
      })
    })

    it('should generate different grids on regenerate', async () => {
      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      // Get first grid
      const firstGrid = wrapper.findAll('.bingo-cell').map(cell => cell.text())

      // Regenerate
      const regenButton = wrapper.find('.regenerate-button')
      await regenButton.trigger('click')
      await nextTick()

      // Get second grid
      const secondGrid = wrapper.findAll('.bingo-cell').map(cell => cell.text())

      // Grids should be different (with very high probability)
      // Center square should be the same
      expect(firstGrid[12]).toBe(secondGrid[12])

      // At least some other cells should be different
      const differentCells = firstGrid.filter((cell, idx) => idx !== 12 && cell !== secondGrid[idx])
      expect(differentCells.length).toBeGreaterThan(0)
    })
  })

  describe('Cell Selection', () => {
    it('should auto-select center square on load', async () => {
      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const centerCell = wrapper.findAll('.bingo-cell')[12]
      expect(centerCell.classes()).toContain('selected')
    })

    it('should toggle cell selection on click', async () => {
      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const firstCell = wrapper.findAll('.bingo-cell')[0]
      expect(firstCell.classes()).not.toContain('selected')

      await firstCell.trigger('click')
      expect(firstCell.classes()).toContain('selected')

      await firstCell.trigger('click')
      expect(firstCell.classes()).not.toContain('selected')
    })

    it('should allow center square to be deselected', async () => {
      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const centerCell = wrapper.findAll('.bingo-cell')[12]
      expect(centerCell.classes()).toContain('selected')

      await centerCell.trigger('click')
      expect(centerCell.classes()).not.toContain('selected')
    })

    it('should reset selections on regenerate', async () => {
      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      // Select some cells
      const cells = wrapper.findAll('.bingo-cell')
      await cells[0].trigger('click')
      await cells[1].trigger('click')
      await cells[2].trigger('click')

      expect(cells[0].classes()).toContain('selected')
      expect(cells[1].classes()).toContain('selected')

      // Regenerate - this will show confirmation dialog
      const regenButton = wrapper.find('.regenerate-button')
      await regenButton.trigger('click')
      await nextTick()

      // Confirm the regeneration in the dialog
      const confirmButton = wrapper.find('.confirm-proceed')
      await confirmButton.trigger('click')
      await nextTick()

      // All cells should be unselected except center
      const newCells = wrapper.findAll('.bingo-cell')
      newCells.forEach((cell, idx) => {
        if (idx === 12) {
          expect(cell.classes()).toContain('selected') // Center auto-selected
        } else {
          expect(cell.classes()).not.toContain('selected')
        }
      })
    })
  })

  describe('Win Detection', () => {
    beforeEach(() => {
      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)
    })

    it('should detect horizontal win (top row)', async () => {
      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const cells = wrapper.findAll('.bingo-cell')
      // Select top row: 0, 1, 2, 3, 4
      for (const idx of [0, 1, 2, 3, 4]) {
        await cells[idx].trigger('click')
      }
      await nextTick()

      expect(wrapper.text()).toContain('BINGO!')
      // Check winning cells have winning class
      for (const idx of [0, 1, 2, 3, 4]) {
        expect(cells[idx].classes()).toContain('winning')
      }
    })

    it('should detect horizontal win (middle row with center)', async () => {
      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const cells = wrapper.findAll('.bingo-cell')
      // Center is already selected, select rest of middle row: 10, 11, 13, 14
      for (const idx of [10, 11, 13, 14]) {
        await cells[idx].trigger('click')
      }
      await nextTick()

      expect(wrapper.text()).toContain('BINGO!')
    })

    it('should detect horizontal win (bottom row)', async () => {
      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const cells = wrapper.findAll('.bingo-cell')
      // Select bottom row: 20, 21, 22, 23, 24
      for (const idx of [20, 21, 22, 23, 24]) {
        await cells[idx].trigger('click')
      }
      await nextTick()

      expect(wrapper.text()).toContain('BINGO!')
    })

    it('should detect vertical win (first column)', async () => {
      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const cells = wrapper.findAll('.bingo-cell')
      // Select first column: 0, 5, 10, 15, 20
      for (const idx of [0, 5, 10, 15, 20]) {
        await cells[idx].trigger('click')
      }
      await nextTick()

      expect(wrapper.text()).toContain('BINGO!')
    })

    it('should detect vertical win (middle column with center)', async () => {
      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const cells = wrapper.findAll('.bingo-cell')
      // Center is already selected, select rest of middle column: 2, 7, 17, 22
      for (const idx of [2, 7, 17, 22]) {
        await cells[idx].trigger('click')
      }
      await nextTick()

      expect(wrapper.text()).toContain('BINGO!')
    })

    it('should detect diagonal win (top-left to bottom-right)', async () => {
      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const cells = wrapper.findAll('.bingo-cell')
      // Center is already selected, select rest of diagonal: 0, 6, 18, 24
      for (const idx of [0, 6, 18, 24]) {
        await cells[idx].trigger('click')
      }
      await nextTick()

      expect(wrapper.text()).toContain('BINGO!')
    })

    it('should detect diagonal win (top-right to bottom-left)', async () => {
      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const cells = wrapper.findAll('.bingo-cell')
      // Center is already selected, select rest of diagonal: 4, 8, 16, 20
      for (const idx of [4, 8, 16, 20]) {
        await cells[idx].trigger('click')
      }
      await nextTick()

      expect(wrapper.text()).toContain('BINGO!')
    })

    it('should detect multiple winning lines', async () => {
      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const cells = wrapper.findAll('.bingo-cell')
      // Create a cross pattern: middle row and middle column
      // Middle row: 10, 11, 12 (center), 13, 14
      // Middle column: 2, 7, 12 (center), 17, 22
      for (const idx of [2, 7, 10, 11, 13, 14, 17, 22]) {
        await cells[idx].trigger('click')
      }
      await nextTick()

      expect(wrapper.text()).toContain('BINGO!')
      // Both the row and column should be winning
      expect(cells[10].classes()).toContain('winning')
      expect(cells[2].classes()).toContain('winning')
    })

    it('should clear BINGO when a winning cell is deselected', async () => {
      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const cells = wrapper.findAll('.bingo-cell')
      // Create top row win
      for (const idx of [0, 1, 2, 3, 4]) {
        await cells[idx].trigger('click')
      }
      await nextTick()

      expect(wrapper.text()).toContain('BINGO!')

      // Deselect one cell
      await cells[0].trigger('click')
      await nextTick()

      expect(wrapper.text()).not.toContain('BINGO!')
    })

    it('should not show BINGO with incomplete row', async () => {
      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const cells = wrapper.findAll('.bingo-cell')
      // Select only 4 cells in top row
      for (const idx of [0, 1, 2, 3]) {
        await cells[idx].trigger('click')
      }
      await nextTick()

      expect(wrapper.text()).not.toContain('BINGO!')
    })
  })

  describe('Navigation', () => {
    it('should navigate back to shows list', async () => {
      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const backLink = wrapper.find('.back-link')
      expect(backLink.attributes('href')).toBe('/')
    })

    it('should navigate to show edit when title is clicked', async () => {
      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const title = wrapper.find('.show-title')
      await title.trigger('click')

      expect(mockPush).toHaveBeenCalledWith('/show/1/edit')
    })
  })

  describe('Fisher-Yates Shuffle Algorithm', () => {
    it('should shuffle phrases (probabilistic test)', async () => {
      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      // Generate multiple grids and check they're not all identical
      const grids: string[][] = []
      for (let i = 0; i < 10; i++) {
        const wrapper = mount(BingoCard, createMountOptions())
        await flushPromises()
        await nextTick()

        const cells = wrapper.findAll('.bingo-cell')
        const grid = cells.map(cell => cell.text())
        grids.push(grid)

        wrapper.unmount()
        vi.clearAllMocks()
        vi.mocked(showService.getShowById).mockResolvedValue(mockShow)
      }

      // Count how many unique grids we have by comparing non-center cells
      const uniqueGrids = new Set<string>()
      grids.forEach(grid => {
        // Create a string representation of non-center cells
        const gridKey = grid.map((cell, idx) => (idx === 12 ? 'CENTER' : cell)).join('|')
        uniqueGrids.add(gridKey)
      })

      // With 10 shuffles of 27 items, we should get at least 2 different arrangements
      // (extremely unlikely to fail unless shuffle is broken)
      expect(uniqueGrids.size).toBeGreaterThan(1)
    })

    it('should include only phrases from the show (excluding center)', async () => {
      vi.mocked(showService.getShowById).mockResolvedValue(mockShow)

      const wrapper = mount(BingoCard, createMountOptions())
      await flushPromises()
      await nextTick()

      const cells = wrapper.findAll('.bingo-cell')

      cells.forEach((cell, idx) => {
        const text = cell.text()
        if (idx === 12) {
          // Center square
          expect(text).toBe("That's what she said")
        } else {
          // Should be one of the phrases
          expect(mockShow.phrases).toContain(text)
        }
      })
    })
  })
})
