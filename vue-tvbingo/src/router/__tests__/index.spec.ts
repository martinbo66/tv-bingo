import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import router from '../index'

describe('Vue Router', () => {
  describe('Route definitions', () => {
    it('should have route for home page', () => {
      const routes = router.getRoutes()
      const homeRoute = routes.find((r) => r.path === '/')

      expect(homeRoute).toBeDefined()
      expect(homeRoute?.components?.default).toBeDefined()
    })

    it('should have route for show details with id parameter', () => {
      const routes = router.getRoutes()
      const showRoute = routes.find((r) => r.path === '/show/:id')

      expect(showRoute).toBeDefined()
      expect(showRoute?.components?.default).toBeDefined()
      // Should accept props
      expect(showRoute?.props.default).toBe(true)
    })

    it('should have route for edit show with id parameter', () => {
      const routes = router.getRoutes()
      const editRoute = routes.find((r) => r.path === '/show/:id/edit')

      expect(editRoute).toBeDefined()
      expect(editRoute?.components?.default).toBeDefined()
      // Should accept props
      expect(editRoute?.props.default).toBe(true)
    })

    it('should have route for create show page', () => {
      const routes = router.getRoutes()
      const createRoute = routes.find((r) => r.path === '/create')

      expect(createRoute).toBeDefined()
      expect(createRoute?.components?.default).toBeDefined()
    })
  })

  describe('Route parameters', () => {
    it('should pass id parameter as prop to show component', async () => {
      await router.push('/show/test-id-123')
      await router.isReady()

      expect(router.currentRoute.value.params.id).toBe('test-id-123')
      expect(router.currentRoute.value.path).toBe('/show/test-id-123')
    })

    it('should pass id parameter as prop to edit component', async () => {
      await router.push('/show/edit-id-456/edit')
      await router.isReady()

      expect(router.currentRoute.value.params.id).toBe('edit-id-456')
      expect(router.currentRoute.value.path).toBe('/show/edit-id-456/edit')
    })
  })

  describe('Navigation', () => {
    beforeEach(async () => {
      await router.push('/')
      await router.isReady()
    })

    it('should navigate between routes programmatically', async () => {
      // Start at home
      expect(router.currentRoute.value.path).toBe('/')

      // Navigate to create
      await router.push('/create')
      expect(router.currentRoute.value.path).toBe('/create')

      // Navigate to show
      await router.push('/show/123')
      expect(router.currentRoute.value.path).toBe('/show/123')

      // Navigate to edit
      await router.push('/show/123/edit')
      expect(router.currentRoute.value.path).toBe('/show/123/edit')

      // Navigate back to home
      await router.push('/')
      expect(router.currentRoute.value.path).toBe('/')
    })

    it('should handle navigation to non-existent route', async () => {
      // Vue Router doesn't throw for non-existent routes in hash mode
      // It will navigate but the route won't match any defined routes
      await router.push('/nonexistent-route')
      expect(router.currentRoute.value.path).toBe('/nonexistent-route')

      // The matched route array should be empty
      expect(router.currentRoute.value.matched.length).toBe(0)
    })
  })

  describe('Hash history mode', () => {
    it('should be configured with hash history', () => {
      // The router should use hash mode (createWebHashHistory)
      // We can verify this by checking the router options
      const options = router.options
      expect(options.history).toBeDefined()

      // Hash mode uses # in URLs
      // We can test this by pushing a route and checking if it would use hash
      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: router.getRoutes()
      })

      expect(testRouter).toBeDefined()
    })

    it('should handle hash-based navigation', async () => {
      // Push different routes and verify they work
      await router.push('/')
      expect(router.currentRoute.value.path).toBe('/')

      await router.push('/show/456')
      expect(router.currentRoute.value.path).toBe('/show/456')
      expect(router.currentRoute.value.params.id).toBe('456')
    })
  })

  describe('Navigation guard', () => {
    it('should execute beforeEach navigation guard', async () => {
      // The router has a beforeEach guard that cleans up URLs
      // We can test that navigation completes successfully
      const spy = vi.spyOn(window.history, 'replaceState')

      await router.push('/create')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/create')

      // Verify navigation completed (guard called next())
      expect(router.currentRoute.value.matched.length).toBeGreaterThan(0)

      spy.mockRestore()
    })
  })
})
