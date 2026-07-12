/**
 * Liquibase baseline shows from
 * spring-tvbingo/.../03-load-baseline-shows.yaml
 * Never mutate or delete these IDs in destructive tests.
 */
export const BASELINE_SHOW_IDS = [1, 2, 3, 4, 5, 6, 7] as const

export const baselineShows = {
  survivor: { id: 1, showTitle: 'Survivor', gameTitle: 'Got Nothing For Ya' },
  toddlersAndTiaras: { id: 2, showTitle: 'Toddlers and Tiaras', gameTitle: 'Blingo' },
  topChef: { id: 3, showTitle: 'Top Chef', gameTitle: 'Top Chef' },
  ancientAliens: { id: 4, showTitle: 'Ancient Aliens', gameTitle: 'Contact!' },
  northWoodsLaw: { id: 5, showTitle: 'North Woods Law', gameTitle: 'On Patrol' },
  theOffice: { id: 6, showTitle: 'The Office', gameTitle: "That's What She Said" },
  friends: { id: 7, showTitle: 'Friends', gameTitle: 'The One With Bingo' }
} as const

export const baselineTitles = Object.values(baselineShows).map(s => s.showTitle)
