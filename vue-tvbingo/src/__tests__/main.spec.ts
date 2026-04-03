import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'

describe('main.ts', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.resetModules()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('mounts the Vue app when #app exists', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    await import('../main')
    await nextTick()

    const appEl = document.getElementById('app')
    expect(appEl).not.toBeNull()
    expect(appEl!.childElementCount).toBeGreaterThan(0)
  })

  it('logs an error when #app is missing', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    await import('../main')

    expect(consoleError).toHaveBeenCalledWith('Mount element #app not found in DOM')
  })
})
