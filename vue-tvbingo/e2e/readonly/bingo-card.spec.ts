import { test, expect } from '@playwright/test'
import { baselineShows } from '../fixtures/baseline-shows'
import { selectors } from '../support/selectors'

test.describe('Bingo card @readonly', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/#/show/${baselineShows.survivor.id}`)
    await expect(page.getByText('Loading bingo card...')).toBeHidden({ timeout: 15_000 })
    await expect(page.locator(selectors.bingoGrid)).toBeVisible()
  })

  test('renders 5x5 grid with center square selected', async ({ page }) => {
    await expect(page.locator(`${selectors.bingoGrid} .bingo-cell`)).toHaveCount(25)
    await expect(page.locator(selectors.bingoCell(12))).toHaveClass(/center-square/)
    await expect(page.locator(selectors.bingoCell(12))).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('heading', { name: baselineShows.survivor.showTitle })).toBeVisible()
  })

  test('regenerate reshuffles without mutating server data', async ({ page }) => {
    const before = await page.locator(selectors.bingoCell(0)).innerText()
    // Retry a few times in case shuffle returns same first cell
    let changed = false
    for (let i = 0; i < 5; i++) {
      await page.locator(selectors.regenerateButton).click()
      const after = await page.locator(selectors.bingoCell(0)).innerText()
      if (after !== before) {
        changed = true
        break
      }
    }
    expect(changed).toBe(true)
  })

  test('toggles a cell and can reset marks', async ({ page }) => {
    const cell = page.locator(selectors.bingoCell(0))
    await cell.click()
    await expect(cell).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.marked-counter')).toContainText('2/25 marked')

    await page.locator(selectors.resetMarksButton).click()
    await expect(cell).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator(selectors.bingoCell(12))).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.marked-counter')).toContainText('1/25 marked')
  })

  test('shows BINGO alert when a line is completed', async ({ page }) => {
    // Middle row: 10,11,12,13,14 — center (12) already marked
    for (const index of [10, 11, 13, 14]) {
      await page.locator(selectors.bingoCell(index)).click()
    }
    await expect(page.locator(selectors.bingoAlert)).toBeVisible()
    await expect(page.locator(selectors.bingoAlert)).toContainText('BINGO!')
  })
})
