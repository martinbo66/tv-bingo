import { test, expect } from '@playwright/test'
import {
  cleanupCreatedShows,
  findShowIdByTitle
} from '../support/cleanup'
import { selectors } from '../support/selectors'

test.describe('Create show @destructive', () => {
  const createdIds: number[] = []

  test.afterEach(async ({ request }) => {
    await cleanupCreatedShows(request, createdIds.splice(0))
  })

  test('creates a show via UI and it appears in the list', async ({ page, request }) => {
    const uniqueTitle = `E2E Create ${Date.now()}`
    const phrases = Array.from({ length: 24 }, (_, i) => `Create phrase ${i + 1}`)

    await page.goto('/#/create')
    await expect(page.getByRole('heading', { name: 'Create New TV Show' })).toBeVisible({
      timeout: 15_000
    })

    await page.locator(selectors.showTitleInput).fill(uniqueTitle)
    await page.locator(selectors.gameTitleInput).fill('E2E Create Game')
    await page.locator(selectors.centerSquareInput).fill('E2E Free')

    await page.locator(selectors.bulkToggle).click()
    await page.locator(selectors.bulkPhrasesInput).fill(phrases.join('\n'))
    await page.getByRole('button', { name: /Add All/ }).click()
    await expect(page.getByText('Phrases (24)')).toBeVisible()

    const submit = page.getByRole('button', { name: 'Create show' })
    await expect(submit).toBeEnabled()

    const createResponsePromise = page.waitForResponse(
      res =>
        res.url().includes('/api/shows') &&
        res.request().method() === 'POST' &&
        res.status() !== 0
    )
    await submit.click()
    const createResponse = await createResponsePromise
    expect(
      createResponse.ok(),
      `Create API failed: ${createResponse.status()} ${await createResponse.text()}`
    ).toBeTruthy()

    await expect(page).toHaveURL(/#\/?$/, { timeout: 15_000 })
    await expect(page.locator(selectors.showCard(uniqueTitle))).toBeVisible()

    const id = await findShowIdByTitle(request, uniqueTitle)
    expect(id).toBeTruthy()
    if (id) {
      createdIds.push(id)
    }
  })
})
