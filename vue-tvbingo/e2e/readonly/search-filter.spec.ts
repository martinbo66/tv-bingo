import { test, expect } from '@playwright/test'
import { baselineShows } from '../fixtures/baseline-shows'
import { selectors } from '../support/selectors'

test.describe('Search and filter @readonly', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/')
    await expect(page.getByText('Loading shows...')).toBeHidden({ timeout: 15_000 })
  })

  test('filters shows by search query', async ({ page }) => {
    const search = page.locator(selectors.searchInput)
    await search.fill('Office')

    await expect(page.locator(selectors.showCard(baselineShows.theOffice.showTitle))).toBeVisible()
    await expect(page.locator(selectors.showCard(baselineShows.friends.showTitle))).toHaveCount(0)
  })

  test('finds Friends and clears search', async ({ page }) => {
    const search = page.locator(selectors.searchInput)
    await search.fill('Friends')
    await expect(page.locator(selectors.showCard(baselineShows.friends.showTitle))).toBeVisible()

    await page.locator(selectors.clearSearch).click()
    await expect(search).toHaveValue('')
    await expect(page.locator(selectors.showCard(baselineShows.survivor.showTitle))).toBeVisible()
  })

  test('shows no-results state for unmatched query', async ({ page }) => {
    await page.locator(selectors.searchInput).fill('zzz-no-such-show-xyz')
    await expect(page.locator('.no-results')).toBeVisible()
  })

  test('phrase-count filters when feature flag is enabled', async ({ page }) => {
    const filterGroup = page.locator(selectors.phraseFilter)
    if ((await filterGroup.count()) === 0) {
      test.skip(true, 'enablePhraseCountFilter is off')
      return
    }

    await filterGroup.getByRole('button', { name: '25+' }).click()
    await expect(page.locator(selectors.showCard(baselineShows.survivor.showTitle))).toBeVisible()

    await page.getByRole('button', { name: /clear all/i }).click()
    await expect(page.locator(selectors.searchInput)).toHaveValue('')
  })
})
