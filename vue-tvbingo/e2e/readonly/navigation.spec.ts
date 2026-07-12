import { test, expect } from '@playwright/test'
import { baselineShows } from '../fixtures/baseline-shows'
import { selectors } from '../support/selectors'

test.describe('Navigation @readonly', () => {
  test('list → bingo card → back to list', async ({ page }) => {
    await page.goto('/#/')
    await expect(page.getByText('Loading shows...')).toBeHidden({ timeout: 15_000 })

    await page.locator(selectors.showCard(baselineShows.survivor.showTitle)).click()
    await expect(page).toHaveURL(new RegExp(`#/show/${baselineShows.survivor.id}$`))
    await expect(page.locator(selectors.bingoGrid)).toBeVisible({ timeout: 15_000 })

    await page.locator(selectors.backToShows).click()
    await expect(page).toHaveURL(/#\/?$/)
    await expect(page.locator(selectors.showCard(baselineShows.survivor.showTitle))).toBeVisible()
  })

  test('opens edit form and cancels without saving', async ({ page }) => {
    await page.goto(`/#/show/${baselineShows.friends.id}/edit`)
    await expect(page.getByRole('heading', { name: 'Edit TV Show' })).toBeVisible({
      timeout: 15_000
    })
    await expect(page.locator(selectors.showTitleInput)).toHaveValue(
      baselineShows.friends.showTitle
    )

    await page.locator('.cancel-btn').click()
    await expect(page).toHaveURL(/#\/?$/)
  })

  test('opens create page and leaves without submitting', async ({ page }) => {
    await page.goto('/#/')
    await expect(page.getByText('Loading shows...')).toBeHidden({ timeout: 15_000 })

    await page.locator(selectors.createShowLink).click()
    await expect(page).toHaveURL(/#\/create/)
    await expect(page.getByRole('heading', { name: 'Create New TV Show' })).toBeVisible()

    await page.locator('.cancel-btn').click()
    // Cancel uses history.back() — return to list
    await expect(page.locator(selectors.searchInput)).toBeVisible({ timeout: 15_000 })
  })
})
