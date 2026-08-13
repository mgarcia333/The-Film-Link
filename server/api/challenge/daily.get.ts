import { getDailyChallenge } from '../../utils/daily-challenge/generate'
import { TmdbError } from '../../utils/tmdb/client'
import { handleTmdbError } from '../../utils/tmdb/handle-error'

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const date = typeof query.date === 'string' && DATE_PATTERN.test(query.date) ? query.date : todayUtc()
  const language = typeof query.lang === 'string' ? query.lang : 'es-ES'

  try {
    return await getDailyChallenge(date, language, toWebRequest(event).signal)
  }
  catch (error) {
    if (error instanceof TmdbError) {
      handleTmdbError(error)
    }
    throw createError({
      statusCode: 503,
      statusMessage: 'DAILY_CHALLENGE_UNAVAILABLE',
      data: { code: 'DAILY_CHALLENGE_UNAVAILABLE' },
      cause: error,
    })
  }
})
