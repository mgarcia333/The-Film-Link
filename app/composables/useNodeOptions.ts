export interface CastOrCrewOption {
  id: number
  name: string
  profilePath: string | null
  creditedAs: 'cast' | 'director'
}

export interface FilmographyOption {
  id: number
  title: string
  posterPath: string | null
  releaseYear: number
  creditedAs: 'cast' | 'director'
}

export function useNodeOptions() {
  const pending = ref(false)
  const failed = ref(false)

  let controller: AbortController | null = null

  async function load<T>(url: string): Promise<T[]> {
    controller?.abort()
    controller = new AbortController()
    pending.value = true
    failed.value = false

    try {
      return await $fetch<T[]>(url, { signal: controller.signal })
    }
    catch (error) {
      if (isAbortError(error)) {
        return []
      }
      failed.value = true
      return []
    }
    finally {
      pending.value = false
    }
  }

  function loadMovieOptions(movieId: number): Promise<CastOrCrewOption[]> {
    return load<CastOrCrewOption>(`/api/movies/${movieId}/credits`)
  }

  function loadPersonOptions(personId: number): Promise<FilmographyOption[]> {
    return load<FilmographyOption>(`/api/people/${personId}/movie-credits`)
  }

  onScopeDispose(() => controller?.abort())

  return { pending, failed, loadMovieOptions, loadPersonOptions }
}
