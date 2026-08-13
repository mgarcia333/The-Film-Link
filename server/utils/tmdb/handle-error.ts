import { TmdbError, type TmdbErrorCode } from './client'

const STATUS_BY_CODE: Record<TmdbErrorCode, number> = {
  TMDB_TIMEOUT: 504,
  TMDB_RATE_LIMITED: 429,
  TMDB_NOT_FOUND: 404,
  TMDB_UNAVAILABLE: 502,
}

// Server errors stay machine-readable (data.code) instead of carrying
// user-facing text, so the client can map them through i18n.
export function handleTmdbError(error: unknown): never {
  if (error instanceof TmdbError) {
    throw createError({
      statusCode: STATUS_BY_CODE[error.code],
      statusMessage: error.code,
      data: { code: error.code },
    })
  }
  throw error
}
