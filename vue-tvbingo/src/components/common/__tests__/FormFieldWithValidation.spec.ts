import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FormFieldWithValidation from '../FormFieldWithValidation.vue'

const defaultProps = {
  modelValue: '',
  label: 'Show Title',
  id: 'show-title'
}

describe('FormFieldWithValidation.vue', () => {
  describe('Validation behavior (triggered on blur)', () => {
    it('shows required error after blur when value is empty', async () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, required: true, modelValue: '' }
      })

      await wrapper.find('input').trigger('blur')
      await nextTick()

      expect(wrapper.find('.field-error').exists()).toBe(true)
      expect(wrapper.find('.field-error').text()).toContain('Show Title is required')
    })

    it('shows required error after blur when value is whitespace only', async () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, required: true, modelValue: '   ' }
      })

      await wrapper.find('input').trigger('blur')
      await nextTick()

      expect(wrapper.find('.field-error').exists()).toBe(true)
      expect(wrapper.find('.field-error').text()).toContain('Show Title is required')
    })

    it('shows no error after blur when required field has valid value', async () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, required: true, modelValue: 'The Office' }
      })

      await wrapper.find('input').trigger('blur')
      await nextTick()

      expect(wrapper.find('.field-error').exists()).toBe(false)
    })

    it('shows maxLength error when value exceeds limit', async () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, maxLength: 10, modelValue: 'This is too long' }
      })

      await wrapper.find('input').trigger('blur')
      await nextTick()

      expect(wrapper.find('.field-error').exists()).toBe(true)
      expect(wrapper.find('.field-error').text()).toContain(
        'Show Title must be 10 characters or less'
      )
    })

    it('shows no error when value is within maxLength', async () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, maxLength: 10, modelValue: 'Short' }
      })

      await wrapper.find('input').trigger('blur')
      await nextTick()

      expect(wrapper.find('.field-error').exists()).toBe(false)
    })

    it('calls custom validator and shows its error message', async () => {
      const validator = vi.fn(() => 'Custom validation error')
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, validator, modelValue: 'some value' }
      })

      await wrapper.find('input').trigger('blur')
      await nextTick()

      expect(validator).toHaveBeenCalledWith('some value')
      expect(wrapper.find('.field-error').text()).toContain('Custom validation error')
    })

    it('shows no error when custom validator returns undefined', async () => {
      const validator = vi.fn(() => undefined)
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, validator, modelValue: 'valid' }
      })

      await wrapper.find('input').trigger('blur')
      await nextTick()

      expect(wrapper.find('.field-error').exists()).toBe(false)
    })
  })

  describe('Character counter', () => {
    it('reflects modelValue.length', () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, maxLength: 50, modelValue: 'hello' }
      })

      expect(wrapper.find('.char-counter').text()).toContain('5')
      expect(wrapper.find('.char-counter').text()).toContain('50')
    })

    it('is visible only when maxLength > 0', () => {
      const withMax = mount(FormFieldWithValidation, {
        props: { ...defaultProps, maxLength: 50, modelValue: '' }
      })
      const withoutMax = mount(FormFieldWithValidation, {
        props: { ...defaultProps, modelValue: '' }
      })

      expect(withMax.find('.char-counter').exists()).toBe(true)
      expect(withoutMax.find('.char-counter').exists()).toBe(false)
    })

    it('applies over-limit class when charCount exceeds maxLength', () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, maxLength: 5, modelValue: 'toolong' }
      })

      expect(wrapper.find('.char-counter').classes()).toContain('over-limit')
    })

    it('does not apply over-limit class when within limit', () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, maxLength: 10, modelValue: 'short' }
      })

      expect(wrapper.find('.char-counter').classes()).not.toContain('over-limit')
    })
  })

  describe('Touch/dirty behavior', () => {
    it('does not show error before blur even if invalid', () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, required: true, modelValue: '' }
      })

      expect(wrapper.find('.field-error').exists()).toBe(false)
    })

    it('shows error after blur if invalid', async () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, required: true, modelValue: '' }
      })

      await wrapper.find('input').trigger('blur')
      await nextTick()

      expect(wrapper.find('.field-error').exists()).toBe(true)
    })

    it('emits validation-error with error string after blur when invalid', async () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, required: true, modelValue: '' }
      })

      await wrapper.find('input').trigger('blur')
      await nextTick()

      const emitted = wrapper.emitted('validation-error')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toContain('Show Title is required')
    })

    it('emits validation-error with undefined after blur when valid', async () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, required: true, modelValue: 'The Office' }
      })

      await wrapper.find('input').trigger('blur')
      await nextTick()

      const emitted = wrapper.emitted('validation-error')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toBeUndefined()
    })
  })

  describe('Aria attributes', () => {
    it('sets aria-required to match required prop', () => {
      const required = mount(FormFieldWithValidation, {
        props: { ...defaultProps, required: true }
      })
      const notRequired = mount(FormFieldWithValidation, {
        props: { ...defaultProps, required: false }
      })

      expect(required.find('input').attributes('aria-required')).toBe('true')
      expect(notRequired.find('input').attributes('aria-required')).toBe('false')
    })

    it('sets aria-invalid to true only when touched and in error', async () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, required: true, modelValue: '' }
      })

      expect(wrapper.find('input').attributes('aria-invalid')).toBe('false')

      await wrapper.find('input').trigger('blur')
      await nextTick()

      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
    })

    it('sets aria-describedby to error element id when in error state', async () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, id: 'my-field', required: true, modelValue: '' }
      })

      await wrapper.find('input').trigger('blur')
      await nextTick()

      expect(wrapper.find('input').attributes('aria-describedby')).toBe('my-field-error')
    })

    it('sets aria-describedby to help element id when helpText is set and no error', () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, id: 'my-field', helpText: 'Enter the show name' }
      })

      expect(wrapper.find('input').attributes('aria-describedby')).toBe('my-field-help')
    })

    it('sets aria-describedby to undefined when no error and no helpText', () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps }
      })

      expect(wrapper.find('input').attributes('aria-describedby')).toBeUndefined()
    })
  })

  describe('Input event', () => {
    it('emits update:modelValue with new value on input', async () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, modelValue: '' }
      })

      const input = wrapper.find('input')
      await input.setValue('new value')

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toBe('new value')
    })
  })

  describe('Rendering', () => {
    it('renders label text', () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, label: 'My Label' }
      })

      expect(wrapper.find('label').text()).toContain('My Label')
    })

    it('shows required indicator when required', () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, required: true }
      })

      expect(wrapper.find('.required-indicator').exists()).toBe(true)
    })

    it('does not show required indicator when not required', () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, required: false }
      })

      expect(wrapper.find('.required-indicator').exists()).toBe(false)
    })

    it('shows helpText when no error', () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, helpText: 'Some help text' }
      })

      expect(wrapper.find('.help-text').exists()).toBe(true)
      expect(wrapper.find('.help-text').text()).toContain('Some help text')
    })

    it('hides helpText when in error state', async () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, required: true, modelValue: '', helpText: 'Some help text' }
      })

      await wrapper.find('input').trigger('blur')
      await nextTick()

      expect(wrapper.find('.help-text').exists()).toBe(false)
      expect(wrapper.find('.field-error').exists()).toBe(true)
    })

    it('applies has-error class to input when touched and invalid', async () => {
      const wrapper = mount(FormFieldWithValidation, {
        props: { ...defaultProps, required: true, modelValue: '' }
      })

      expect(wrapper.find('input').classes()).not.toContain('has-error')

      await wrapper.find('input').trigger('blur')
      await nextTick()

      expect(wrapper.find('input').classes()).toContain('has-error')
    })
  })
})
