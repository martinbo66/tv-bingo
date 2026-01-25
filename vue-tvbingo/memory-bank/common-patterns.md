# Common Patterns and Solutions

This document catalogues common patterns and solutions used throughout the Vue TV Bingo project.

## Component Patterns

### State Management
```typescript
// Using composables for shared state
export function useBingoState() {
  const state = reactive({
    numbers: [] as number[],
    isPlaying: false,
    currentNumber: null as number | null
  })

  const actions = {
    startGame() {
      state.isPlaying = true
      state.numbers = generateNumbers()
    },
    drawNumber() {
      if (state.numbers.length === 0) return
      state.currentNumber = state.numbers.pop()!
    }
  }

  return {
    state,
    ...actions
  }
}
```

### Props and Events
```vue
<!-- Consistent props and events pattern -->
<script setup lang="ts">
interface Props {
  value: string
  label?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:value', value: string): void
  (e: 'change', value: string): void
}>()
</script>
```

### Error Handling
```typescript
// Error boundary pattern
export function useErrorBoundary() {
  const error = ref<Error | null>(null)
  
  const handleError = (err: Error) => {
    error.value = err
    // Log to error tracking service
    logError(err)
  }

  return {
    error,
    handleError
  }
}
```

## Service Patterns

### API Client
```typescript
// API client pattern with error handling
export class ApiClient {
  private baseUrl: string
  private headers: Record<string, string>

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.headers = {
      'Content-Type': 'application/json'
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers
        }
      })
      
      if (!response.ok) {
        throw new ApiError(response.statusText, response.status)
      }
      
      return response.json()
    } catch (error) {
      handleApiError(error)
      throw error
    }
  }
}
```

### Data Transformation
```typescript
// Data transformation pattern
export function transformBingoCard(data: RawBingoCard): BingoCard {
  return {
    id: data.id,
    numbers: data.numbers.map(n => ({
      value: n,
      marked: false
    })),
    createdAt: new Date(data.createdAt)
  }
}
```

## Utility Patterns

### Debouncing
```typescript
// Debounce utility
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
```

### Local Storage
```typescript
// Local storage pattern
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const stored = localStorage.getItem(key)
  const value = ref<T>(stored ? JSON.parse(stored) : defaultValue)
  
  watch(value, (newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue))
  })
  
  return value
}
```

## Testing Patterns

### Component Testing
```typescript
// Component test pattern
describe('BingoCard', () => {
  it('marks number when clicked', async () => {
    const wrapper = mount(BingoCard, {
      props: {
        numbers: [1, 2, 3]
      }
    })
    
    await wrapper.find('[data-test="number-1"]').trigger('click')
    expect(wrapper.find('[data-test="number-1"]').classes()).toContain('marked')
  })
})
```

### Mock Service
```typescript
// Mock service pattern
export class MockBingoService implements BingoService {
  private numbers: number[] = []
  
  async generateNumbers(): Promise<number[]> {
    this.numbers = Array.from({ length: 75 }, (_, i) => i + 1)
    return this.numbers
  }
  
  async drawNumber(): Promise<number> {
    if (this.numbers.length === 0) {
      throw new Error('No numbers left')
    }
    return this.numbers.pop()!
  }
}
```

## Best Practices

### Component Organization
- Keep components focused and single-responsibility
- Use composition over inheritance
- Extract reusable logic into composables
- Maintain consistent prop and event naming

### State Management
- Use reactive state sparingly
- Prefer props over global state
- Implement proper cleanup in composables
- Use computed properties for derived state

### Error Handling
- Implement proper error boundaries
- Use typed errors
- Provide user-friendly error messages
- Log errors appropriately

### Performance
- Use lazy loading for routes
- Implement proper caching strategies
- Optimize re-renders
- Use proper key attributes

### Testing
- Write tests for critical functionality
- Use proper test isolation
- Implement meaningful assertions
- Maintain test coverage 