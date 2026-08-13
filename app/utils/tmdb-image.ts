const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

export type TmdbImageSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'original'

export function tmdbImageUrl(path: string | null, size: TmdbImageSize = 'w185'): string | null {
  if (!path) {
    return null
  }
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`
}
