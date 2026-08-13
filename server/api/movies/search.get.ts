import { searchMovies } from '../../utils/tmdb/search'
import { handleTmdbError } from '../../utils/tmdb/handle-error'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = typeof query.q === 'string' ? query.q : ''
  const language = typeof query.lang === 'string' ? query.lang : 'es-ES'

  try {
    return await searchMovies(search, language, toWebRequest(event).signal)
  }
  catch (error) {
    handleTmdbError(error)
  }
})
