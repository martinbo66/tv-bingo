<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue: string
  label: string
  id: string
  required?: boolean
  maxLength?: number
  placeholder?: string
  helpText?: string
  validator?: (value: string) => string | undefined
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  maxLength: 0,
  placeholder: '',
  helpText: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'validation-error': [error: string | undefined]
}>()

const touched = ref(false)
const errorMessage = ref<string | undefined>(undefined)

// Computed character count
const charCount = computed(() => props.modelValue?.length || 0)

// Computed: is over limit
const isOverLimit = computed(() => {
  return props.maxLength > 0 && charCount.value > props.maxLength
})

// Validate the field
const validate = (): string | undefined => {
  if (props.required && !props.modelValue?.trim()) {
    return `${props.label} is required`
  }

  if (props.maxLength > 0 && props.modelValue.length > props.maxLength) {
    return `${props.label} must be ${props.maxLength} characters or less`
  }

  // Custom validator if provided
  if (props.validator) {
    return props.validator(props.modelValue)
  }

  return undefined
}

// Mark field as touched
const markTouched = () => {
  touched.value = true
  validateAndEmit()
}

// Validate and emit error
const validateAndEmit = () => {
  if (touched.value) {
    errorMessage.value = validate()
    emit('validation-error', errorMessage.value)
  }
}

// Handle input
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
  validateAndEmit()
}

// Has error for styling
const hasError = computed(() => touched.value && !!errorMessage.value)
</script>

<template>
  <div class="form-field">
    <div class="label-row">
      <label :for="id">
        {{ label }}
        <span v-if="required" class="required-indicator">*</span>
      </label>
      <span v-if="maxLength > 0" class="char-counter" :class="{ 'over-limit': isOverLimit }">
        {{ charCount }} / {{ maxLength }}
      </span>
    </div>
    <input
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :class="{ 'has-error': hasError }"
      :aria-required="required"
      :aria-invalid="hasError"
      :aria-describedby="hasError ? `${id}-error` : helpText ? `${id}-help` : undefined"
      @input="handleInput"
      @blur="markTouched"
    />
    <div v-if="helpText && !hasError" :id="`${id}-help`" class="help-text">
      {{ helpText }}
    </div>
    <div v-if="hasError" :id="`${id}-error`" class="field-error" role="alert">
      {{ errorMessage }}
    </div>
  </div>
</template>

<style scoped>
.form-field {
  margin-bottom: 1.5rem;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

label {
  color: #888;
  font-weight: 500;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.required-indicator {
  color: #ff4444;
  margin-left: 0.25rem;
  font-weight: bold;
}

.char-counter {
  color: #666;
  font-size: 0.85rem;
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
}

.char-counter.over-limit {
  color: #ff4444;
  font-weight: 600;
}

.help-text {
  color: #666;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  line-height: 1.4;
}

.field-error {
  color: #ff4444;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.field-error::before {
  content: '⚠';
  font-size: 1rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  background-color: #2c2c2c;
  border: 1px solid #444;
  border-radius: 6px;
  color: #fff;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #646cff;
  box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.2);
}

input.has-error {
  border-color: #ff4444;
}

input.has-error:focus {
  border-color: #ff4444;
  box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.2);
}
</style>
