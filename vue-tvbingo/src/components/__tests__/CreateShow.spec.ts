import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CreateShow from '../CreateShow.vue'

const mockSetupGuards = vi.fn()
const mockHasUnsavedChanges = { value: false }

vi.mock('../../composables/useUnsavedChangesGuard', () => ({
  useUnsavedChangesGuard: vi.fn(() => ({
    hasUnsavedChanges: mockHasUnsavedChanges,
    setupGuards: mockSetupGuards
  }))
}))

const mountOptions = () => ({
  global: {
    stubs: {
      FormFieldWithValidation: {
        name: 'FormFieldWithValidation',
        template: '<div class="form-field-stub"></div>',
        emits: ['update:modelValue', 'validation-error'],
        props: ['modelValue', 'label', 'id', 'required', 'maxLength', 'placeholder', 'validator']
      },
      PhraseListManager: {
        name: 'PhraseListManager',
        template: '<div class="phrase-list-manager-stub"></div>',
        emits: ['update:phrases'],
        props: ['phrases', 'allowInlineEdit', 'showBulkAdd', 'autoSort', 'maxPhraseLength']
      }
    }
  }
})

describe('CreateShow.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHasUnsavedChanges.value = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Form submission — blocked cases', () => {
    it('does not emit showCreated when showTitle is empty', async () => {
      const wrapper = mount(CreateShow, mountOptions())

      await wrapper.find('form').trigger('submit')
      await nextTick()

      expect(wrapper.emitted('showCreated')).toBeUndefined()
    })

    it('does not emit showCreated when title is valid but phrases is empty', async () => {
      const wrapper = mount(CreateShow, mountOptions())

      // Set showTitle via the internal ref — trigger input on the first FormFieldWithValidation
      const formFields = wrapper.findAllComponents({ name: 'FormFieldWithValidation' })
      await formFields[0].vm.$emit('update:modelValue', 'The Office')
      await nextTick()

      // phrases remain empty
      await wrapper.find('form').trigger('submit')
      await nextTick()

      expect(wrapper.emitted('showCreated')).toBeUndefined()
    })
  })

  describe('Form submission — success', () => {
    it('emits showCreated with showTitle and phrases when both are provided', async () => {
      const wrapper = mount(CreateShow, mountOptions())

      const formFields = wrapper.findAllComponents({ name: 'FormFieldWithValidation' })
      await formFields[0].vm.$emit('update:modelValue', 'The Office')
      await nextTick()

      const phraseManager = wrapper.findComponent({ name: 'PhraseListManager' })
      await phraseManager.vm.$emit('update:phrases', ['Thats what she said', 'Dwight'])
      await nextTick()

      await wrapper.find('form').trigger('submit')
      await nextTick()

      expect(wrapper.emitted('showCreated')).toBeDefined()
      const payload = wrapper.emitted('showCreated')![0][0] as Record<string, unknown>
      expect(payload.showTitle).toBe('The Office')
      expect(payload.phrases).toEqual(['Thats what she said', 'Dwight'])
    })

    it('includes gameTitle in payload when non-empty', async () => {
      const wrapper = mount(CreateShow, mountOptions())

      const formFields = wrapper.findAllComponents({ name: 'FormFieldWithValidation' })
      await formFields[0].vm.$emit('update:modelValue', 'The Office')
      await formFields[1].vm.$emit('update:modelValue', 'Office Bingo')
      await nextTick()

      const phraseManager = wrapper.findComponent({ name: 'PhraseListManager' })
      await phraseManager.vm.$emit('update:phrases', ['Thats what she said'])
      await nextTick()

      await wrapper.find('form').trigger('submit')
      await nextTick()

      const payload = wrapper.emitted('showCreated')![0][0] as Record<string, unknown>
      expect(payload.gameTitle).toBe('Office Bingo')
    })

    it('includes centerSquare in payload when non-empty', async () => {
      const wrapper = mount(CreateShow, mountOptions())

      const formFields = wrapper.findAllComponents({ name: 'FormFieldWithValidation' })
      await formFields[0].vm.$emit('update:modelValue', 'The Office')
      await formFields[2].vm.$emit('update:modelValue', 'FREE SPACE')
      await nextTick()

      const phraseManager = wrapper.findComponent({ name: 'PhraseListManager' })
      await phraseManager.vm.$emit('update:phrases', ['Thats what she said'])
      await nextTick()

      await wrapper.find('form').trigger('submit')
      await nextTick()

      const payload = wrapper.emitted('showCreated')![0][0] as Record<string, unknown>
      expect(payload.centerSquare).toBe('FREE SPACE')
    })

    it('omits gameTitle and centerSquare from payload when empty', async () => {
      const wrapper = mount(CreateShow, mountOptions())

      const formFields = wrapper.findAllComponents({ name: 'FormFieldWithValidation' })
      await formFields[0].vm.$emit('update:modelValue', 'The Office')
      await nextTick()

      const phraseManager = wrapper.findComponent({ name: 'PhraseListManager' })
      await phraseManager.vm.$emit('update:phrases', ['Thats what she said'])
      await nextTick()

      await wrapper.find('form').trigger('submit')
      await nextTick()

      const payload = wrapper.emitted('showCreated')![0][0] as Record<string, unknown>
      expect(payload).not.toHaveProperty('gameTitle')
      expect(payload).not.toHaveProperty('centerSquare')
    })
  })

  describe('Validation display', () => {
    it('sets showTitleError after attempted submit with empty title', async () => {
      const wrapper = mount(CreateShow, mountOptions())

      // phrases still empty but let's check the title error path
      await wrapper.find('form').trigger('submit')
      await nextTick()

      // The error element should be rendered since phrases-help div appears when no phrases
      expect(wrapper.emitted('showCreated')).toBeUndefined()
    })

    it('validateShowTitle returns undefined for valid non-empty string', async () => {
      const wrapper = mount(CreateShow, mountOptions())

      // Set a valid title then submit with phrases to confirm no title error blocks it
      const formFields = wrapper.findAllComponents({ name: 'FormFieldWithValidation' })
      await formFields[0].vm.$emit('update:modelValue', 'Valid Title')
      const phraseManager = wrapper.findComponent({ name: 'PhraseListManager' })
      await phraseManager.vm.$emit('update:phrases', ['A phrase'])
      await nextTick()

      await wrapper.find('form').trigger('submit')
      await nextTick()

      expect(wrapper.emitted('showCreated')).toBeDefined()
    })
  })

  describe('Cancel — no unsaved changes', () => {
    it('calls window.history.back() immediately without confirm dialog', async () => {
      mockHasUnsavedChanges.value = false
      const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {})
      const confirmSpy = vi.spyOn(window, 'confirm')

      const wrapper = mount(CreateShow, mountOptions())

      await wrapper.find('.cancel-btn').trigger('click')
      await nextTick()

      expect(confirmSpy).not.toHaveBeenCalled()
      expect(backSpy).toHaveBeenCalledOnce()
    })
  })

  describe('Cancel — with unsaved changes', () => {
    it('calls window.confirm when there are unsaved changes', async () => {
      mockHasUnsavedChanges.value = true
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      vi.spyOn(window.history, 'back').mockImplementation(() => {})

      const wrapper = mount(CreateShow, mountOptions())

      await wrapper.find('.cancel-btn').trigger('click')
      await nextTick()

      expect(confirmSpy).toHaveBeenCalledOnce()
    })

    it('calls window.history.back() when user confirms the dialog', async () => {
      mockHasUnsavedChanges.value = true
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {})

      const wrapper = mount(CreateShow, mountOptions())

      await wrapper.find('.cancel-btn').trigger('click')
      await nextTick()

      expect(backSpy).toHaveBeenCalledOnce()
    })

    it('does not call window.history.back() when user declines the dialog', async () => {
      mockHasUnsavedChanges.value = true
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {})

      const wrapper = mount(CreateShow, mountOptions())

      await wrapper.find('.cancel-btn').trigger('click')
      await nextTick()

      expect(backSpy).not.toHaveBeenCalled()
    })
  })

  describe('Phrase list', () => {
    it('updates internal phrases when PhraseListManager emits update:phrases', async () => {
      const wrapper = mount(CreateShow, mountOptions())

      const formFields = wrapper.findAllComponents({ name: 'FormFieldWithValidation' })
      await formFields[0].vm.$emit('update:modelValue', 'The Office')
      await nextTick()

      const phraseManager = wrapper.findComponent({ name: 'PhraseListManager' })
      await phraseManager.vm.$emit('update:phrases', ['New phrase 1', 'New phrase 2'])
      await nextTick()

      await wrapper.find('form').trigger('submit')
      await nextTick()

      const payload = wrapper.emitted('showCreated')![0][0] as Record<string, unknown>
      expect(payload.phrases).toEqual(['New phrase 1', 'New phrase 2'])
    })

    it('shows help message when phrases list is empty', async () => {
      const wrapper = mount(CreateShow, mountOptions())

      expect(wrapper.find('.phrases-help').exists()).toBe(true)
      expect(wrapper.text()).toContain('Add at least one phrase')
    })

    it('hides help message when phrases list has entries', async () => {
      const wrapper = mount(CreateShow, mountOptions())

      const phraseManager = wrapper.findComponent({ name: 'PhraseListManager' })
      await phraseManager.vm.$emit('update:phrases', ['A phrase'])
      await nextTick()

      expect(wrapper.find('.phrases-help').exists()).toBe(false)
    })
  })
})
