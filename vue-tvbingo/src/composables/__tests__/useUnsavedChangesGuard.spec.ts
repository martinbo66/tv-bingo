import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, type Ref } from 'vue'
import { useUnsavedChangesGuard } from '../useUnsavedChangesGuard'

// Capture the onBeforeRouteLeave callback so we can call it manually
let routeLeaveCallback: (() => false | undefined) | null = null

vi.mock('vue-router', () => ({
  onBeforeRouteLeave: vi.fn((cb: () => false | undefined) => {
    routeLeaveCallback = cb
  })
}))

// Helper: run a composable inside a mounted component so Vue lifecycle hooks fire
function withSetup<T>(composable: () => T): [T, ReturnType<typeof mount>] {
  let result!: T
  const wrapper = mount({
    setup() {
      result = composable()
      return () => {}
    }
  })
  return [result, wrapper]
}

describe('useUnsavedChangesGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeLeaveCallback = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('hasUnsavedChanges', () => {
    it('is false when currentData equals originalData', () => {
      const original = ref({ title: 'Hello' })
      const current = ref({ title: 'Hello' })

      const [{ hasUnsavedChanges }, wrapper] = withSetup(() =>
        useUnsavedChangesGuard(original as Ref<unknown>, current as Ref<unknown>)
      )

      expect(hasUnsavedChanges.value).toBe(false)
      wrapper.unmount()
    })

    it('is true when currentData differs from originalData', () => {
      const original = ref({ title: 'Hello' })
      const current = ref({ title: 'Changed' })

      const [{ hasUnsavedChanges }, wrapper] = withSetup(() =>
        useUnsavedChangesGuard(original as Ref<unknown>, current as Ref<unknown>)
      )

      expect(hasUnsavedChanges.value).toBe(true)
      wrapper.unmount()
    })

    it('is reactive — updates when currentData changes', async () => {
      const original = ref({ title: 'Hello' })
      const current = ref({ title: 'Hello' })

      const [{ hasUnsavedChanges }, wrapper] = withSetup(() =>
        useUnsavedChangesGuard(original as Ref<unknown>, current as Ref<unknown>)
      )

      expect(hasUnsavedChanges.value).toBe(false)

      current.value = { title: 'Changed' }
      await wrapper.vm.$nextTick()

      expect(hasUnsavedChanges.value).toBe(true)
      wrapper.unmount()
    })
  })

  describe('markClean()', () => {
    it('sets originalData to a deep copy of currentData', () => {
      const original = ref({ title: 'Old' })
      const current = ref({ title: 'New' })

      const [{ markClean }, wrapper] = withSetup(() =>
        useUnsavedChangesGuard(original as Ref<unknown>, current as Ref<unknown>)
      )

      markClean()

      expect(original.value).toEqual({ title: 'New' })
      wrapper.unmount()
    })

    it('makes hasUnsavedChanges false after calling', () => {
      const original = ref({ title: 'Old' })
      const current = ref({ title: 'New' })

      const [{ hasUnsavedChanges, markClean }, wrapper] = withSetup(() =>
        useUnsavedChangesGuard(original as Ref<unknown>, current as Ref<unknown>)
      )

      expect(hasUnsavedChanges.value).toBe(true)
      markClean()
      expect(hasUnsavedChanges.value).toBe(false)
      wrapper.unmount()
    })

    it('makes a deep copy — further changes to currentData still register as dirty', async () => {
      const original = ref({ title: 'Hello' })
      const current = ref({ title: 'Hello' })

      const [{ hasUnsavedChanges, markClean }, wrapper] = withSetup(() =>
        useUnsavedChangesGuard(original as Ref<unknown>, current as Ref<unknown>)
      )

      markClean()
      expect(hasUnsavedChanges.value).toBe(false)

      current.value = { title: 'Changed after clean' }
      await wrapper.vm.$nextTick()

      expect(hasUnsavedChanges.value).toBe(true)
      wrapper.unmount()
    })
  })

  describe('handleBeforeUnload (via setupGuards)', () => {
    it('does not call e.preventDefault() when no unsaved changes', () => {
      const original = ref({ title: 'Hello' })
      const current = ref({ title: 'Hello' })

      const addEventSpy = vi.spyOn(window, 'addEventListener')

      // setupGuards() must be called inside setup() so onMounted registers correctly
      const [, wrapper] = withSetup(() => {
        const guard = useUnsavedChangesGuard(original as Ref<unknown>, current as Ref<unknown>)
        guard.setupGuards()
        return guard
      })

      const call = addEventSpy.mock.calls.find(([event]) => event === 'beforeunload')
      expect(call).toBeDefined()
      const handler = call![1] as (e: BeforeUnloadEvent) => void

      const mockEvent = { preventDefault: vi.fn(), returnValue: '' } as unknown as BeforeUnloadEvent
      handler(mockEvent)

      expect(mockEvent.preventDefault).not.toHaveBeenCalled()
      wrapper.unmount()
    })

    it('calls e.preventDefault() and sets e.returnValue when there are unsaved changes', () => {
      const original = ref({ title: 'Old' })
      const current = ref({ title: 'New' })

      const addEventSpy = vi.spyOn(window, 'addEventListener')

      const [, wrapper] = withSetup(() => {
        const guard = useUnsavedChangesGuard(original as Ref<unknown>, current as Ref<unknown>)
        guard.setupGuards()
        return guard
      })

      const call = addEventSpy.mock.calls.find(([event]) => event === 'beforeunload')
      expect(call).toBeDefined()
      const handler = call![1] as (e: BeforeUnloadEvent) => void

      const mockEvent = { preventDefault: vi.fn(), returnValue: '' } as unknown as BeforeUnloadEvent
      handler(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalledOnce()
      wrapper.unmount()
    })

    it('removes the beforeunload listener on unmount', () => {
      const original = ref({ title: 'Hello' })
      const current = ref({ title: 'Hello' })

      const removeEventSpy = vi.spyOn(window, 'removeEventListener')

      const [, wrapper] = withSetup(() => {
        const guard = useUnsavedChangesGuard(original as Ref<unknown>, current as Ref<unknown>)
        guard.setupGuards()
        return guard
      })

      wrapper.unmount()

      expect(removeEventSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    })
  })

  describe('setupGuards — router guard', () => {
    it('allows navigation when there are no unsaved changes', () => {
      const original = ref({ title: 'Hello' })
      const current = ref({ title: 'Hello' })

      const [, wrapper] = withSetup(() => {
        const guard = useUnsavedChangesGuard(original as Ref<unknown>, current as Ref<unknown>)
        guard.setupGuards()
        return guard
      })

      expect(routeLeaveCallback).not.toBeNull()
      const result = routeLeaveCallback!()

      expect(result).toBeUndefined()
      wrapper.unmount()
    })

    it('blocks navigation (returns false) when dirty and user cancels confirm', () => {
      const original = ref({ title: 'Old' })
      const current = ref({ title: 'New' })

      vi.spyOn(window, 'confirm').mockReturnValue(false)

      const [, wrapper] = withSetup(() => {
        const guard = useUnsavedChangesGuard(original as Ref<unknown>, current as Ref<unknown>)
        guard.setupGuards()
        return guard
      })

      const result = routeLeaveCallback!()

      expect(result).toBe(false)
      wrapper.unmount()
    })

    it('allows navigation (returns undefined) when dirty and user confirms', () => {
      const original = ref({ title: 'Old' })
      const current = ref({ title: 'New' })

      vi.spyOn(window, 'confirm').mockReturnValue(true)

      const [, wrapper] = withSetup(() => {
        const guard = useUnsavedChangesGuard(original as Ref<unknown>, current as Ref<unknown>)
        guard.setupGuards()
        return guard
      })

      const result = routeLeaveCallback!()

      expect(result).toBeUndefined()
      wrapper.unmount()
    })

    it('does not show confirm when there are no unsaved changes', () => {
      const original = ref({ title: 'Hello' })
      const current = ref({ title: 'Hello' })

      const confirmSpy = vi.spyOn(window, 'confirm')

      const [, wrapper] = withSetup(() => {
        const guard = useUnsavedChangesGuard(original as Ref<unknown>, current as Ref<unknown>)
        guard.setupGuards()
        return guard
      })

      routeLeaveCallback!()

      expect(confirmSpy).not.toHaveBeenCalled()
      wrapper.unmount()
    })
  })
})
