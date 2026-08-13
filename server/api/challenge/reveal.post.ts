import { findPathBetweenMovies } from '../../utils/path-finding/validate'
import { handleTmdbError } from '../../utils/tmdb/handle-error'
import { parseMovieSummary } from '../../utils/tmdb/parse-movie-summary'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const source = parseMovieSummary(body?.source)
  const destination = parseMovieSummary(body?.destination)
  if (!source || !destination) {
    throw createError({ statusCode: 400, statusMessage: 'INVALID_MOVIE_PAIR' })
  }
  const language = typeof body?.language === 'string' ? body.language : 'es-ES'

  try {
    // Reuses the same cache entry /api/challenge/validate already warmed,
    // so this is effectively instant by the time a game actually ends.
    const result = await findPathBetweenMovies(source, destination, language, toWebRequest(event).signal)
    return {
      path: result.path,
      stepCount: result.path ? result.path.length - 1 : null,
    }
  }
  catch (error) {
    handleTmdbError(error)
  }
})
