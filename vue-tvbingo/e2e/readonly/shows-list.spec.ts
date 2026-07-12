import { test, expect } from '@playwright/test'
import { baselineShows, baselineTitles } from '../fixtures/baseline-shows'
import { selectors } from '../support/selectors'

test.describe('Shows list @readonly', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/')
    await expect(page.getByText('Loading shows...')).toBeHidden({ timeout: 15_000 })
  })

  test('loads home and shows baseline titles', async ({ page }) => {
    for (const title of baselineTitles) {
      await expect(page.locator(selectors.showCard(title))).toBeVisible()
    }
  })

  test('toggles between grid and list view', async ({ page }) => {
    await expect(page.locator(selectors.showsGrid)).toBeVisible()

    await page.locator(`${selectors.viewToggle} button[title^="List view"]`).click()
    await expect(page.locator(selectors.showsList)).toBeVisible()
    await expect(
      page.locator(selectors.showListRow(baselineShows.survivor.showTitle))
    ).toBeVisible()

    await page.locator(`${selectors.viewToggle} button[title^="Grid view"]`).click()
    await expect(page.locator(selectors.showsGrid)).toBeVisible()
    await expect(page.locator(selectors.showCard(baselineShows.friends.showTitle))).toBeVisible()
  })
})
