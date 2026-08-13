import type { DifficultyLevel } from '~~/types/difficulty'
import { getDifficultyChallenge } from '../../utils/difficulty-challenge/generate'
import { TmdbError } from '../../utils/tmdb/client'
import { handleTmdbError } from '../../utils/tmdb/handle-error'

const VALID_DIFFICULTIES: DifficultyLevel[] = ['easy', 'normal', 'difficult']

// Generous but bounded: generation runs a search-and-retry loop server-side,
// so it deserves more room than the single-pair validate budget, but must
// never hang indefinitely.
const GENERATION_TIMEOUT_MS = 20000

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const difficulty = (typeof query.difficulty === 'string' && VALID_DIFFICULTIES.includes(query.difficulty as DifficultyLevel)
    ? query.difficulty
    : 'normal') as DifficultyLevel
  const language = typeof query.lang === 'string' ? query.lang : 'es-ES'

  const timeoutController = new AbortController()
  const timeout = setTimeout(() => timeoutController.abort(), GENERATION_TIMEOUT_MS)
  const signal = AbortSignal.any([timeoutController.signal, toWebRequest(event).signal])

  try {
    return await getDifficultyChallenge(difficulty, language, signal)
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
