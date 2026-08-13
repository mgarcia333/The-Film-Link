import { getMovieCastAndCrew } from '../../../utils/tmdb/credits'
import { handleTmdbError } from '../../../utils/tmdb/handle-error'

export default defineEventHandler(async (event) => {
  const movieId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(movieId)) {
    throw createError({ statusCode: 400, statusMessage: 'INVALID_MOVIE_ID' })
  }

  const query = getQuery(event)
  const language = typeof query.lang === 'string' ? query.lang : 'es-ES'

  try {
    return await getMovieCastAndCrew(movieId, language, toWebRequest(event).signal)
  }
  catch (error) {
    handleTmdbError(error)
  }
})
