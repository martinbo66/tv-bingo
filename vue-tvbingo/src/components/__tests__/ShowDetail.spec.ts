import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import ShowDetail from '../ShowDetail.vue'
import { showService } from '../../services/showService'
import { ApiError } from '../../services/apiClient'
import type { Show } from '../../types/Show'

const mockPush = vi.fn()
const mockMarkClean = vi.fn()
const mockSetupGuards = vi.fn()
const mockHasUnsavedChanges = { value: false }

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: mockPush }))
}))

vi.mock('../../services/showService', () => ({
  showService: {
    getShowById: vi.fn(),
    updateShow: vi.fn()
  }
}))

vi.mock('../../composables/useUnsavedChangesGuard', () => ({
  useUnsavedChangesGuard: vi.fn(() => ({
    hasUnsavedChanges: mockHasUnsavedChanges,
    markClean: mockMarkClean,
    setupGuards: mockSetupGuards
  }))
}))

const mockShow: Show = {
  id: 1,
  showTitle: 'The Office',
  gameTitle: 'Office Bingo',
  centerSquare: 'FREE',
  phrases: ['phrase 1', 'phrase 2']
}

const mountOptions = () => ({
  props: { id: '1' },
  global: {
    stubs: {
      FormFieldWithValidation: true,
      PhraseListManager: {
        name: 'PhraseListManager',
        template: '<div class="phrase-list-manager-stub"></div>',
        emits: ['update:phrases'],
        props: ['phrases', 'allowInlineEdit', 'showBulkAdd', 'autoSort', 'maxPhraseLength']
      }
    }
  }
})

describe('ShowDetail.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHasUnsavedChanges.value = false
    vi.mocked(showService.getShowById).mockResolvedValue(mockShow)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Loading state', () => {
    it('shows loading indicator before getShowById resolves', async () => {
      let resolveShow!: (value: Show) => void
      vi.mocked(showService.getShowById).mockReturnValue(
        new Promise(resolve => {
          resolveShow = resolve
        })
      )

      const wrapper = mount(ShowDetail, mountOptions())

      expect(wrapper.find('.loading').exists()).toBe(true)
      expect(wrapper.text()).toContain('Loading show')

      resolveShow(mockShow)
      await flushPromises()

      expect(wrapper.find('.loading').exists()).toBe(false)
    })

    it('removes loading state after promise resolves', async () => {
      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      expect(wrapper.find('.loading').exists()).toBe(false)
    })
  })

  describe('Fetch success', () => {
    it('renders the form after loading completes', async () => {
      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      expect(wrapper.find('form').exists()).toBe(true)
    })

    it('defaults optional fields to empty string when undefined in API response', async () => {
      const showWithoutOptionals: Show = {
        id: 2,
        showTitle: 'Minimal Show',
        phrases: ['phrase']
      }
      vi.mocked(showService.getShowById).mockResolvedValue(showWithoutOptionals)

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      expect(wrapper.find('form').exists()).toBe(true)
      expect(wrapper.find('.error').exists()).toBe(false)
    })
  })

  describe('Fetch error', () => {
    it('shows error message when getShowById throws', async () => {
      vi.mocked(showService.getShowById).mockRejectedValue(new Error('Network error'))

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      expect(wrapper.find('.error').exists()).toBe(true)
      expect(wrapper.text()).toContain('Failed to load show')
    })

    it('does not render the form on fetch error', async () => {
      vi.mocked(showService.getShowById).mockRejectedValue(new Error('Network error'))

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      expect(wrapper.find('form').exists()).toBe(false)
    })
  })

  describe('Save — happy path', () => {
    it('calls updateShow with a plain copy of the show', async () => {
      vi.mocked(showService.updateShow).mockResolvedValue(mockShow)

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(showService.updateShow).toHaveBeenCalledOnce()
      expect(showService.updateShow).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, showTitle: 'The Office' })
      )
    })

    it('calls markClean after successful save', async () => {
      vi.mocked(showService.updateShow).mockResolvedValue(mockShow)

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(mockMarkClean).toHaveBeenCalledOnce()
    })

    it('navigates to "/" after successful save', async () => {
      vi.mocked(showService.updateShow).mockResolvedValue(mockShow)

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  describe('Save — 400 validation error', () => {
    it('shows formatted validation error message', async () => {
      vi.mocked(showService.updateShow).mockRejectedValue(
        new ApiError('Bad Request', 400, { showTitle: 'Title is required' })
      )

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('showTitle')
    })

    it('does not navigate after 400 error', async () => {
      vi.mocked(showService.updateShow).mockRejectedValue(
        new ApiError('Bad Request', 400, { showTitle: 'Title is required' })
      )

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Save — 409 conflict', () => {
    it('shows "Show title must be unique" error message', async () => {
      vi.mocked(showService.updateShow).mockRejectedValue(
        new ApiError('Conflict', 409, { showTitle: 'Show title must be unique' })
      )

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Show title must be unique')
    })

    it('does not navigate after 409 error', async () => {
      vi.mocked(showService.updateShow).mockRejectedValue(
        new ApiError('Conflict', 409, { showTitle: 'Show title must be unique' })
      )

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Save — 404 not found', () => {
    it('shows "Show not found. It may have been deleted." message', async () => {
      vi.mocked(showService.updateShow).mockRejectedValue(new ApiError('Not Found', 404))

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.text()).toContain('Show not found. It may have been deleted.')
    })
  })

  describe('Save — generic error', () => {
    it('shows fallback error message for non-ApiError', async () => {
      vi.mocked(showService.updateShow).mockRejectedValue(new Error('Something went wrong'))

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Failed to save show. Please try again.')
    })

    it('shows fallback error message for unknown ApiError status', async () => {
      vi.mocked(showService.updateShow).mockRejectedValue(new ApiError('Server Error', 500))

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Failed to save show')
    })
  })

  describe('Cancel — no unsaved changes', () => {
    it('navigates to "/" immediately without confirming', async () => {
      mockHasUnsavedChanges.value = false
      const confirmSpy = vi.spyOn(globalThis, 'confirm')

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      await wrapper.find('.cancel-btn').trigger('click')
      await nextTick()

      expect(confirmSpy).not.toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  describe('Cancel — with unsaved changes', () => {
    it('calls window.confirm when there are unsaved changes', async () => {
      mockHasUnsavedChanges.value = true
      const confirmSpy = vi.spyOn(globalThis, 'confirm').mockReturnValue(true)

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      await wrapper.find('.cancel-btn').trigger('click')
      await nextTick()

      expect(confirmSpy).toHaveBeenCalledOnce()
    })

    it('navigates to "/" when user confirms the dialog', async () => {
      mockHasUnsavedChanges.value = true
      vi.spyOn(globalThis, 'confirm').mockReturnValue(true)

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      await wrapper.find('.cancel-btn').trigger('click')
      await nextTick()

      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('stays on page when user declines the dialog', async () => {
      mockHasUnsavedChanges.value = true
      vi.spyOn(globalThis, 'confirm').mockReturnValue(false)

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      await wrapper.find('.cancel-btn').trigger('click')
      await nextTick()

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Phrase update', () => {
    it('updates show phrases when PhraseListManager emits update:phrases', async () => {
      vi.mocked(showService.updateShow).mockResolvedValue(mockShow)

      const wrapper = mount(ShowDetail, mountOptions())
      await flushPromises()

      const phraseManager = wrapper.findComponent({ name: 'PhraseListManager' })
      expect(phraseManager.exists()).toBe(true)

      const newPhrases = ['new phrase 1', 'new phrase 2', 'new phrase 3']
      await phraseManager.vm.$emit('update:phrases', newPhrases)
      await nextTick()

      // Submit to verify updated phrases are sent to the service
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(showService.updateShow).toHaveBeenCalledWith(
        expect.objectContaining({ phrases: newPhrases })
      )
    })
  })
})
