import { findPathBetweenMovies } from '../../utils/path-finding/validate'
import { handleTmdbError } from '../../utils/tmdb/handle-error'
import { parseMovieSummary } from '../../utils/tmdb/parse-movie-summary'

// Keeps validation well under the 8s budget so the client always gets a
// clear answer instead of a hanging request.
const VALIDATION_TIMEOUT_MS = 7500

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const source = parseMovieSummary(body?.source)
  const destination = parseMovieSummary(body?.destination)
  if (!source || !destination) {
    throw createError({ statusCode: 400, statusMessage: 'INVALID_MOVIE_PAIR' })
  }
  const language = typeof body?.language === 'string' ? body.language : 'es-ES'

  const timeoutController = new AbortController()
  const timeout = setTimeout(() => timeoutController.abort(), VALIDATION_TIMEOUT_MS)
  const signal = AbortSignal.any([timeoutController.signal, toWebRequest(event).signal])

  try {
    // Only connectivity is revealed here - the actual path is a spoiler and
    // is only handed over by /api/challenge/reveal once the game ends.
    const result = await findPathBetweenMovies(source, destination, language, signal)
    return { connected: result.connected }
  }
  catch (error) {
    handleTmdbError(error)
  }
  finally {
    clearTimeout(timeout)
  }
})
