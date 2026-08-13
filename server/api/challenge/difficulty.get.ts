import type { DifficultyLevel } from '~~/types/difficulty'
import { getDifficultyChallenge, localizeDifficultyChallenge } from '../../utils/difficulty-challenge/generate'
import { popFromPool, refillPool } from '../../utils/difficulty-challenge/pool'
import { TmdbError } from '../../utils/tmdb/client'
import { handleTmdbError } from '../../utils/tmdb/handle-error'

const VALID_DIFFICULTIES: DifficultyLevel[] = ['easy', 'normal', 'difficult']

// Generous but bounded: generation runs a search-and-retry loop server-side,
// so it deserves more room than the single-pair validate budget, but must
// never hang indefinitely. Only reached on the cold-pool fallback path
// below - the common case is a cache read, nowhere near this budget. Kept
// comfortably above generate.ts's own GENERATION_DEADLINE_MS + one more
// PER_ATTEMPT_TIMEOUT_MS, so this outer clock is never what cuts a
// generation off first.
const GENERATION_TIMEOUT_MS = 28000

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const difficulty = (typeof query.difficulty === 'string' && VALID_DIFFICULTIES.includes(query.difficulty as DifficultyLevel)
    ? query.difficulty
    : 'normal') as DifficultyLevel
  const language = typeof query.lang === 'string' ? query.lang : 'es-ES'

  // Fast path: a challenge is already sitting ready in the cache from a
  // previous background refill, so serving it is just a cache read plus (if the
  // display language differs) localizing two already-known movie ids - no
  // live search, no TMDB fan-out, no wait. Refilling the slot this just
  // emptied happens after the response is sent, never before.
  const pooled = await popFromPool(difficulty)
  if (pooled) {
    event.waitUntil(refillPool(difficulty).catch(() => {}))
    try {
      return await localizeDifficultyChallenge(pooled, language, toWebRequest(event).signal)
    }
    catch {
      // Localizing an already-generated pair failed (e.g. a transient TMDB
      // hiccup) - fall through to a fresh live generation rather than
      // wasting the response on an error the player can't do anything about.
    }
  }

  // Cold path: nothing was ready (first request after a deploy, or the
  // buffer got drained faster than it refilled). Generates live, the same
  // way this endpoint always has, then tops the buffer up in the
  // background so the next request doesn't pay this cost again either.
  const timeoutController = new AbortController()
  const timeout = setTimeout(() => timeoutController.abort(), GENERATION_TIMEOUT_MS)
  const signal = AbortSignal.any([timeoutController.signal, toWebRequest(event).signal])

  try {
    const result = await getDifficultyChallenge(difficulty, language, signal)
    event.waitUntil(refillPool(difficulty).catch(() => {}))
    return result
  }
  catch (error) {
    if (error instanceof TmdbError) {
      handleTmdbError(error)
    }
    throw createError({
      statusCode: 503,
      statusMessage: 'DIFFICULTY_CHALLENGE_UNAVAILABLE',
      data: { code: 'DIFFICULTY_CHALLENGE_UNAVAILABLE' },
      cause: error,
    })
  }
  finally {
    clearTimeout(timeout)
  }
})
