import type { TmdbMovieSummary } from '~~/types/tmdb'

const SEARCH_DEBOUNCE_MS = 300

export function useMovieSearch() {
  const { locale } = useI18n()
  const results = ref<TmdbMovieSummary[]>([])
  const pending = ref(false)
  const failed = ref(false)

  let controller: AbortController | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function runSearch(query: string) {
    controller?.abort()
    controller = new AbortController()
    pending.value = true
    failed.value = false

    try {
      results.value = await $fetch<TmdbMovieSummary[]>('/api/movies/search', {
        query: { q: query, lang: toTmdbLanguage(locale.value) },
        signal: controller.signal,
      })
    }
    catch (error) {
      if (isAbortError(error)) {
        return
      }
      failed.value = true
      results.value = []
    }
    finally {
      pending.value = false
    }
  }

  function search(query: string) {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    const trimmed = query.trim()
    if (!trimmed) {
      controller?.abort()
      results.value = []
      pending.value = false
      failed.value = false
      return
    }
    pending.value = true
    debounceTimer = setTimeout(() => runSearch(trimmed), SEARCH_DEBOUNCE_MS)
  }

  function clear() {
    controller?.abort()
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    results.value = []
    pending.value = false
    failed.value = false
  }

  onScopeDispose(clear)

  return { results, pending, failed, search, clear }
}
