import { test, expect } from '@playwright/test'
import { cleanupCreatedShows, createShowViaApi, apiBaseURL, type CreatedShow } from '../support/cleanup'
import { selectors } from '../support/selectors'

test.describe('Edit and delete show @destructive', () => {
  let show: CreatedShow

  test.beforeEach(async ({ request }) => {
    show = await createShowViaApi(request)
  })

  test.afterEach(async ({ request }) => {
    if (show?.id && show.id > 0) {
      await cleanupCreatedShows(request, [show.id])
    }
  })

  test('edits show title via UI', async ({ page }) => {
    const updatedTitle = `${show.showTitle} edited`

    await page.goto(`/#/show/${show.id}/edit`)
    await expect(page.getByRole('heading', { name: 'Edit TV Show' })).toBeVisible({
      timeout: 15_000
    })

    await page.locator(selectors.showTitleInput).fill(updatedTitle)
    await page.locator(selectors.saveShow).click()
    await expect(page).toHaveURL(/#\/?$/, { timeout: 15_000 })
    await expect(page.locator(selectors.showCard(updatedTitle))).toBeVisible()

    show = { ...show, showTitle: updatedTitle }
  })

  test('opens bingo card for API-created show', async ({ page }) => {
    await page.goto(`/#/show/${show.id}`)
    await expect(page.locator(selectors.bingoGrid)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: show.showTitle })).toBeVisible()
  })

  test('deletes show with confirmation', async ({ page, request }) => {
    await page.goto('/#/')
    await expect(page.getByText('Loading shows...')).toBeHidden({ timeout: 15_000 })

    const card = page.locator(selectors.showCard(show.showTitle))
    await expect(card).toBeVisible()

    page.once('dialog', dialog => dialog.accept())
    await card.locator('[aria-label="Delete show"]').click()

    await expect(page.locator(selectors.showCard(show.showTitle))).toHaveCount(0, {
      timeout: 15_000
    })

    const response = await request.get(`${apiBaseURL()}/api/shows/${show.id}`)
    expect(response.status()).toBe(404)
    show = { id: -1, showTitle: show.showTitle }
  })

  test('cancel delete leaves show intact', async ({ page }) => {
    await page.goto('/#/')
    await expect(page.getByText('Loading shows...')).toBeHidden({ timeout: 15_000 })

    const card = page.locator(selectors.showCard(show.showTitle))
    page.once('dialog', dialog => dialog.dismiss())
    await card.locator('[aria-label="Delete show"]').click()

    await expect(card).toBeVisible()
  })
})
