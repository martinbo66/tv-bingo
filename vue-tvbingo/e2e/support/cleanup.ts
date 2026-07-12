import type { APIRequestContext } from '@playwright/test'
import { BASELINE_SHOW_IDS } from '../fixtures/baseline-shows'

export type CreatedShow = {
  id: number
  showTitle: string
}

/** Backend origin for API setup/teardown (Vite does not proxy /api). */
export function apiBaseURL(): string {
  return process.env.E2E_API_BASE_URL || 'http://localhost:8080'
}

/**
 * API helpers for destructive e2e setup/teardown.
 * Never deletes Liquibase baseline show IDs.
 */
export async function createShowViaApi(
  request: APIRequestContext,
  partial?: Partial<{
    showTitle: string
    gameTitle: string
    centerSquare: string
    phrases: string[]
  }>
): Promise<CreatedShow> {
  const unique = `E2E ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const phrases =
    partial?.phrases ?? Array.from({ length: 24 }, (_, i) => `${unique} phrase ${i + 1}`)

  const response = await request.post(`${apiBaseURL()}/api/shows`, {
    data: {
      showTitle: partial?.showTitle ?? unique,
      gameTitle: partial?.gameTitle ?? 'E2E Game',
      centerSquare: partial?.centerSquare ?? 'E2E Center',
      phrases
    }
  })

  if (!response.ok()) {
    throw new Error(`Failed to create show via API: ${response.status()} ${await response.text()}`)
  }

  const body = (await response.json()) as CreatedShow
  return { id: body.id, showTitle: body.showTitle }
}

export async function deleteShowViaApi(request: APIRequestContext, id: number): Promise<void> {
  if ((BASELINE_SHOW_IDS as readonly number[]).includes(id)) {
    throw new Error(`Refusing to delete baseline show id=${id}`)
  }

  const response = await request.delete(`${apiBaseURL()}/api/shows/${id}`)
  if (!response.ok() && response.status() !== 404) {
    throw new Error(`Failed to delete show ${id}: ${response.status()} ${await response.text()}`)
  }
}

export async function cleanupCreatedShows(
  request: APIRequestContext,
  ids: Iterable<number>
): Promise<void> {
  for (const id of ids) {
    await deleteShowViaApi(request, id)
  }
}

export async function findShowIdByTitle(
  request: APIRequestContext,
  showTitle: string
): Promise<number | undefined> {
  const response = await request.get(`${apiBaseURL()}/api/shows`)
  if (!response.ok()) {
    throw new Error(`Failed to list shows: ${response.status()}`)
  }
  const shows = (await response.json()) as CreatedShow[]
  return shows.find(s => s.showTitle === showTitle)?.id
}
