import type { TmdbMovieSummary } from '~~/types/tmdb'
import type { GamePathNode } from '~/stores/game'

interface RevealResponse {
  path: GamePathNode[] | null
  stepCount: number | null
}

export function useChallengeReveal() {
  const { locale } = useI18n()
  const pending = ref(false)
  const errorCode = ref<string | null>(null)

  async function reveal(source: TmdbMovieSummary, destination: TmdbMovieSummary): Promise<RevealResponse> {
    pending.value = true
    errorCode.value = null

    try {
      return await $fetch<RevealResponse>('/api/challenge/reveal', {
        method: 'POST',
        body: { source, destination, language: toTmdbLanguage(locale.value) },
      })
    }
    catch (error) {
      errorCode.value = extractErrorCode(error) ?? 'UNKNOWN'
      return { path: null, stepCount: null }
    }
    finally {
      pending.value = false
    }
  }

  return { pending, errorCode, reveal }
}
