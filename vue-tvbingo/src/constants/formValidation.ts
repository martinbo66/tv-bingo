/**
 * Shared validation constants for form fields
 */

export const VALIDATION_LIMITS = {
  SHOW_TITLE: 100,
  GAME_TITLE: 100,
  CENTER_SQUARE: 50,
  PHRASE: 100
} as const

export const ERROR_MESSAGES = {
  REQUIRED: (field: string) => `${field} is required`,
  TOO_LONG: (field: string, max: number) =>
    `${field} must be ${max} characters or less`
} as const
