import { getPersonFilmography } from '../../../utils/tmdb/credits'
import { handleTmdbError } from '../../../utils/tmdb/handle-error'

export default defineEventHandler(async (event) => {
  const personId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(personId)) {
    throw createError({ statusCode: 400, statusMessage: 'INVALID_PERSON_ID' })
  }

  const query = getQuery(event)
  const language = typeof query.lang === 'string' ? query.lang : 'es-ES'

  try {
    return await getPersonFilmography(personId, language, toWebRequest(event).signal)
  }
  catch (error) {
    handleTmdbError(error)
  }
})
