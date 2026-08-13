import { getDifficultyChallenge } from '../../utils/difficulty-challenge/generate'
import { TmdbError } from '../../utils/tmdb/client'
import { handleTmdbError } from '../../utils/tmdb/handle-error'
import type { DifficultyLevel } from '../../utils/difficulty-challenge/generate'

const VALID_DIFFICULTIES: DifficultyLevel[] = ['easy', 'normal', 'difficult']

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const difficulty = (typeof query.difficulty === 'string' && VALID_DIFFICULTIES.includes(query.difficulty as DifficultyLevel)
    ? query.difficulty
    : 'normal') as DifficultyLevel
  const language = typeof query.lang === 'string' ? query.lang : 'es-ES'

  try {
    return await getDifficultyChallenge(difficulty, language, toWebRequest(event).signal)
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
})
