import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import PhraseListManager from '../PhraseListManager.vue'

const DEFAULT_MAX = 50

function mountManager(phrases: string[] = [], extraProps: Record<string, unknown> = {}) {
  return mount(PhraseListManager, {
    props: { phrases, ...extraProps }
  })
}

describe('PhraseListManager.vue', () => {
  describe('Rendering', () => {
    it('shows empty state when no phrases', () => {
      const wrapper = mountManager([])
      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })

    it('hides empty state when phrases exist', () => {
      const wrapper = mountManager(['Hello'])
      expect(wrapper.find('.empty-state').exists()).toBe(false)
    })

    it('displays phrase count in label', () => {
      const wrapper = mountManager(['A', 'B', 'C'])
      expect(wrapper.find('.phrases-list-section label').text()).toContain('3')
    })

    it('renders each phrase', () => {
      const wrapper = mountManager(['Alpha', 'Beta'])
      const items = wrapper.findAll('.phrase-text')
      const texts = items.map(i => i.text())
      expect(texts).toContain('Alpha')
      expect(texts).toContain('Beta')
    })
  })

  describe('Add single phrase', () => {
    it('emits update:phrases with new phrase appended on Add click', async () => {
      const wrapper = mountManager(['Existing'])
      await wrapper.find('#new-phrase-input').setValue('New Phrase')
      await wrapper.find('button[aria-label="Add new phrase"]').trigger('click')
      await nextTick()

      const emitted = wrapper.emitted('update:phrases')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toEqual(['Existing', 'New Phrase'])
    })

    it('emits update:phrases on Enter key in input', async () => {
      const wrapper = mountManager([])
      await wrapper.find('#new-phrase-input').setValue('Via Enter')
      await wrapper.find('#new-phrase-input').trigger('keydown.enter')
      await nextTick()

      expect(wrapper.emitted('update:phrases')?.[0][0]).toEqual(['Via Enter'])
    })

    it('emits phrases-changed when phrase is added', async () => {
      const wrapper = mountManager([])
      await wrapper.find('#new-phrase-input').setValue('A phrase')
      await wrapper.find('button[aria-label="Add new phrase"]').trigger('click')
      await nextTick()

      expect(wrapper.emitted('phrases-changed')).toBeTruthy()
    })

    it('clears the input after adding', async () => {
      const wrapper = mountManager([])
      const input = wrapper.find('#new-phrase-input')
      await input.setValue('Typed phrase')
      await wrapper.find('button[aria-label="Add new phrase"]').trigger('click')
      await nextTick()

      expect((input.element as HTMLInputElement).value).toBe('')
    })

    it('does not emit when input is empty', async () => {
      const wrapper = mountManager([])
      await wrapper.find('button[aria-label="Add new phrase"]').trigger('click')
      await nextTick()

      expect(wrapper.emitted('update:phrases')).toBeFalsy()
    })

    it('does not emit when input is whitespace only', async () => {
      const wrapper = mountManager([])
      await wrapper.find('#new-phrase-input').setValue('   ')
      await wrapper.find('button[aria-label="Add new phrase"]').trigger('click')
      await nextTick()

      expect(wrapper.emitted('update:phrases')).toBeFalsy()
    })

    it('shows validation error when phrase exceeds maxPhraseLength', async () => {
      const wrapper = mountManager([], { maxPhraseLength: 10 })
      await wrapper.find('#new-phrase-input').setValue('This is too long for the limit')
      await wrapper.find('button[aria-label="Add new phrase"]').trigger('click')
      await nextTick()

      expect(wrapper.find('#new-phrase-error').exists()).toBe(true)
      expect(wrapper.find('#new-phrase-error').text()).toContain('10 characters or less')
      expect(wrapper.emitted('update:phrases')).toBeFalsy()
    })

    it('shows over-limit class on char counter when input exceeds max', async () => {
      const wrapper = mountManager([], { maxPhraseLength: 5 })
      await wrapper.find('#new-phrase-input').setValue('toolong')
      await nextTick()

      expect(wrapper.find('.char-counter').classes()).toContain('over-limit')
    })

    it('does not show over-limit class when within max', async () => {
      const wrapper = mountManager([], { maxPhraseLength: 10 })
      await wrapper.find('#new-phrase-input').setValue('short')
      await nextTick()

      expect(wrapper.find('.char-counter').classes()).not.toContain('over-limit')
    })

    it('re-validates on input after phrase was touched', async () => {
      const wrapper = mountManager([], { maxPhraseLength: 5 })
      // Trigger to set touched + error
      await wrapper.find('#new-phrase-input').setValue('toolong')
      await wrapper.find('button[aria-label="Add new phrase"]').trigger('click')
      await nextTick()

      expect(wrapper.find('#new-phrase-error').exists()).toBe(true)

      // Fix the value via input event
      await wrapper.find('#new-phrase-input').setValue('ok')
      await nextTick()

      expect(wrapper.find('#new-phrase-error').exists()).toBe(false)
    })
  })

  describe('Delete phrase', () => {
    beforeEach(() => {
      vi.spyOn(globalThis, 'confirm').mockReturnValue(true)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('emits update:phrases without the deleted phrase on confirm', async () => {
      const wrapper = mountManager(['Alpha', 'Beta', 'Gamma'])
      // With autoSort true, find and click the remove button for 'Beta'
      const items = wrapper.findAll('.phrase-item')
      // sorted order: Alpha, Beta, Gamma
      await items[1].find('.remove-btn').trigger('click')
      await nextTick()

      const emitted = wrapper.emitted('update:phrases')
      expect(emitted).toBeTruthy()
      // Should emit without 'Beta'
      expect(emitted![0][0]).not.toContain('Beta')
      expect(emitted![0][0]).toContain('Alpha')
      expect(emitted![0][0]).toContain('Gamma')
    })

    it('emits phrases-changed when phrase is deleted', async () => {
      const wrapper = mountManager(['Alpha'])
      await wrapper.find('.remove-btn').trigger('click')
      await nextTick()

      expect(wrapper.emitted('phrases-changed')).toBeTruthy()
    })

    it('does not emit when user cancels confirm', async () => {
      vi.spyOn(globalThis, 'confirm').mockReturnValue(false)
      const wrapper = mountManager(['Alpha'])
      await wrapper.find('.remove-btn').trigger('click')
      await nextTick()

      expect(wrapper.emitted('update:phrases')).toBeFalsy()
    })

    it('calls confirm with phrase text', async () => {
      const wrapper = mountManager(['My Phrase'])
      await wrapper.find('.remove-btn').trigger('click')

      expect(globalThis.confirm).toHaveBeenCalledWith('Remove phrase "My Phrase"?')
    })
  })

  describe('Inline edit', () => {
    it('enters edit mode when phrase text is clicked', async () => {
      const wrapper = mountManager(['Hello'])
      await wrapper.find('.phrase-text').trigger('click')
      await nextTick()

      expect(wrapper.find('.edit-input').exists()).toBe(true)
    })

    it('does not enter edit mode when allowInlineEdit is false', async () => {
      const wrapper = mountManager(['Hello'], { allowInlineEdit: false })
      await wrapper.find('.phrase-text').trigger('click')
      await nextTick()

      expect(wrapper.find('.edit-input').exists()).toBe(false)
    })

    it('emits updated phrases on Enter key in edit input', async () => {
      const wrapper = mountManager(['Old Phrase'])
      await wrapper.find('.phrase-text').trigger('click')
      await nextTick()

      const editInput = wrapper.find('.edit-input')
      await editInput.setValue('New Phrase')
      await editInput.trigger('keydown.enter')
      await nextTick()

      const emitted = wrapper.emitted('update:phrases')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toEqual(['New Phrase'])
    })

    it('emits updated phrases on blur of edit input', async () => {
      const wrapper = mountManager(['Old Value'])
      await wrapper.find('.phrase-text').trigger('click')
      await nextTick()

      const editInput = wrapper.find('.edit-input')
      await editInput.setValue('Updated Value')
      await editInput.trigger('blur')
      await nextTick()

      const emitted = wrapper.emitted('update:phrases')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toEqual(['Updated Value'])
    })

    it('cancels edit on Escape key without emitting', async () => {
      const wrapper = mountManager(['Original'])
      await wrapper.find('.phrase-text').trigger('click')
      await nextTick()

      const editInput = wrapper.find('.edit-input')
      await editInput.setValue('Changed')
      await editInput.trigger('keydown.escape')
      await nextTick()

      expect(wrapper.emitted('update:phrases')).toBeFalsy()
      expect(wrapper.find('.edit-input').exists()).toBe(false)
    })

    it('does not emit when saved value is empty', async () => {
      const wrapper = mountManager(['Original'])
      await wrapper.find('.phrase-text').trigger('click')
      await nextTick()

      const editInput = wrapper.find('.edit-input')
      await editInput.setValue('   ')
      await editInput.trigger('keydown.enter')
      await nextTick()

      expect(wrapper.emitted('update:phrases')).toBeFalsy()
    })

    it('phrases-changed emitted after successful edit', async () => {
      const wrapper = mountManager(['Original'])
      await wrapper.find('.phrase-text').trigger('click')
      await nextTick()

      const editInput = wrapper.find('.edit-input')
      await editInput.setValue('Updated')
      await editInput.trigger('keydown.enter')
      await nextTick()

      expect(wrapper.emitted('phrases-changed')).toBeTruthy()
    })
  })

  describe('Sort behavior', () => {
    it('displays phrases in alphabetical order when autoSort is true', () => {
      const wrapper = mountManager(['Zebra', 'Apple', 'Mango'])
      const items = wrapper.findAll('.phrase-text')
      const texts = items.map(i => i.text())
      expect(texts).toEqual(['Apple', 'Mango', 'Zebra'])
    })

    it('displays phrases in insertion order when autoSort is false', () => {
      const wrapper = mountManager(['Zebra', 'Apple', 'Mango'], { autoSort: false })
      const items = wrapper.findAll('.phrase-text')
      const texts = items.map(i => i.text())
      expect(texts).toEqual(['Zebra', 'Apple', 'Mango'])
    })

    it('sort is case-insensitive', () => {
      const wrapper = mountManager(['banana', 'Apple', 'cherry'])
      const items = wrapper.findAll('.phrase-text')
      const texts = items.map(i => i.text())
      expect(texts).toEqual(['Apple', 'banana', 'cherry'])
    })
  })

  describe('Phrase count', () => {
    it('reflects props.phrases.length', () => {
      const wrapper = mountManager(['A', 'B', 'C', 'D'])
      expect(wrapper.find('.phrases-list-section label').text()).toContain('4')
    })

    it('updates when phrases change', async () => {
      const wrapper = mountManager(['A'])
      expect(wrapper.find('.phrases-list-section label').text()).toContain('1')

      await wrapper.setProps({ phrases: ['A', 'B', 'C'] })
      expect(wrapper.find('.phrases-list-section label').text()).toContain('3')
    })
  })

  describe('Bulk add', () => {
    it('shows bulk add toggle button when showBulkAdd is true', () => {
      const wrapper = mountManager([])
      expect(wrapper.find('.bulk-toggle-btn').exists()).toBe(true)
    })

    it('hides bulk add section when showBulkAdd is false', () => {
      const wrapper = mountManager([], { showBulkAdd: false })
      expect(wrapper.find('.bulk-add-section').exists()).toBe(false)
    })

    it('toggles bulk add interface on button click', async () => {
      const wrapper = mountManager([])
      expect(wrapper.find('.bulk-add-container').exists()).toBe(false)

      await wrapper.find('.bulk-toggle-btn').trigger('click')
      await nextTick()
      expect(wrapper.find('.bulk-add-container').exists()).toBe(true)

      await wrapper.find('.bulk-toggle-btn').trigger('click')
      await nextTick()
      expect(wrapper.find('.bulk-add-container').exists()).toBe(false)
    })

    it('emits update:phrases with all valid lines from textarea', async () => {
      const wrapper = mountManager(['Existing'])
      await wrapper.find('.bulk-toggle-btn').trigger('click')
      await nextTick()

      await wrapper.find('#bulk-phrases-input').setValue('Line One\nLine Two\nLine Three')
      await wrapper.find('.add-bulk-btn').trigger('click')
      await nextTick()

      const emitted = wrapper.emitted('update:phrases')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toEqual(['Existing', 'Line One', 'Line Two', 'Line Three'])
    })

    it('skips empty lines in bulk add', async () => {
      const wrapper = mountManager([])
      await wrapper.find('.bulk-toggle-btn').trigger('click')
      await nextTick()

      await wrapper.find('#bulk-phrases-input').setValue('First\n\nSecond\n\n')
      await wrapper.find('.add-bulk-btn').trigger('click')
      await nextTick()

      expect(wrapper.emitted('update:phrases')?.[0][0]).toEqual(['First', 'Second'])
    })

    it('shows error for lines exceeding maxPhraseLength, does not add them', async () => {
      const wrapper = mountManager([], { maxPhraseLength: 10 })
      await wrapper.find('.bulk-toggle-btn').trigger('click')
      await nextTick()

      await wrapper
        .find('#bulk-phrases-input')
        .setValue('Short\nThis line is way too long for the limit')
      await wrapper.find('.add-bulk-btn').trigger('click')
      await nextTick()

      // The short phrase still gets added
      const emitted = wrapper.emitted('update:phrases')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toEqual(['Short'])

      // Error shown for the too-long line
      expect(wrapper.find('.bulk-errors').exists()).toBe(true)
      expect(wrapper.find('.field-error').text()).toContain('too long')
    })

    it('clears textarea and hides interface on success', async () => {
      const wrapper = mountManager([])
      await wrapper.find('.bulk-toggle-btn').trigger('click')
      await nextTick()

      await wrapper.find('#bulk-phrases-input').setValue('Phrase One\nPhrase Two')
      await wrapper.find('.add-bulk-btn').trigger('click')
      await nextTick()

      expect(wrapper.find('.bulk-add-container').exists()).toBe(false)
    })

    it('does not emit when bulk textarea is empty', async () => {
      const wrapper = mountManager([])
      await wrapper.find('.bulk-toggle-btn').trigger('click')
      await nextTick()

      // Add All button should be disabled with empty textarea
      const addBtn = wrapper.find('.add-bulk-btn')
      expect((addBtn.element as HTMLButtonElement).disabled).toBe(true)
    })

    it('cancel button in bulk add hides the interface', async () => {
      const wrapper = mountManager([])
      await wrapper.find('.bulk-toggle-btn').trigger('click')
      await nextTick()

      expect(wrapper.find('.bulk-add-container').exists()).toBe(true)
      await wrapper.find('.cancel-bulk-btn').trigger('click')
      await nextTick()

      expect(wrapper.find('.bulk-add-container').exists()).toBe(false)
    })

    it('shows correct phrase count in bulk textarea label', async () => {
      const wrapper = mountManager([])
      await wrapper.find('.bulk-toggle-btn').trigger('click')
      await nextTick()

      await wrapper.find('#bulk-phrases-input').setValue('First\nSecond\nThird')
      await nextTick()

      expect(wrapper.find('.bulk-add-container .char-counter').text()).toContain('3')
    })

    it('emits phrases-changed when bulk phrases are added', async () => {
      const wrapper = mountManager([])
      await wrapper.find('.bulk-toggle-btn').trigger('click')
      await nextTick()

      await wrapper.find('#bulk-phrases-input').setValue('Phrase A')
      await wrapper.find('.add-bulk-btn').trigger('click')
      await nextTick()

      expect(wrapper.emitted('phrases-changed')).toBeTruthy()
    })

    it('trims whitespace from each bulk line', async () => {
      const wrapper = mountManager([])
      await wrapper.find('.bulk-toggle-btn').trigger('click')
      await nextTick()

      await wrapper.find('#bulk-phrases-input').setValue('  Leading\nTrailing  ')
      await wrapper.find('.add-bulk-btn').trigger('click')
      await nextTick()

      expect(wrapper.emitted('update:phrases')?.[0][0]).toEqual(['Leading', 'Trailing'])
    })
  })

  describe('Default props', () => {
    it('uses VALIDATION_LIMITS.PHRASE as default maxPhraseLength', async () => {
      const wrapper = mountManager([])
      // Default max is 50 per VALIDATION_LIMITS.PHRASE
      const longPhrase = 'A'.repeat(DEFAULT_MAX + 1)
      await wrapper.find('#new-phrase-input').setValue(longPhrase)
      await wrapper.find('button[aria-label="Add new phrase"]').trigger('click')
      await nextTick()

      expect(wrapper.find('#new-phrase-error').exists()).toBe(true)
      expect(wrapper.emitted('update:phrases')).toBeFalsy()
    })

    it('allows phrase exactly at maxPhraseLength limit', async () => {
      const wrapper = mountManager([])
      const exactPhrase = 'A'.repeat(DEFAULT_MAX)
      await wrapper.find('#new-phrase-input').setValue(exactPhrase)
      await wrapper.find('button[aria-label="Add new phrase"]').trigger('click')
      await nextTick()

      expect(wrapper.find('#new-phrase-error').exists()).toBe(false)
      expect(wrapper.emitted('update:phrases')).toBeTruthy()
    })
  })
})
