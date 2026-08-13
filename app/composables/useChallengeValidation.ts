import type { TmdbMovieSummary } from '~~/types/tmdb'

export function useChallengeValidation() {
  const pending = ref(false)
  const errorCode = ref<string | null>(null)

  let controller: AbortController | null = null

  async function validate(source: TmdbMovieSummary, destination: TmdbMovieSummary): Promise<boolean> {
    controller?.abort()
    controller = new AbortController()
    pending.value = true
    errorCode.value = null

    try {
      const result = await $fetch<{ connected: boolean }>('/api/challenge/validate', {
        method: 'POST',
        body: { source, destination },
        signal: controller.signal,
      })
      return result.connected
    }
    catch (error) {
      if (isAbortError(error)) {
        return false
      }
      errorCode.value = extractErrorCode(error) ?? 'UNKNOWN'
      return false
    }
    finally {
      pending.value = false
    }
  }

  function cancel() {
    controller?.abort()
    pending.value = false
  }

  onScopeDispose(cancel)

  return { pending, errorCode, validate, cancel }
}
