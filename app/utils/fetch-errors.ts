export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

export function extractErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { code?: unknown } }).data
    if (data && typeof data.code === 'string') {
      return data.code
    }
  }
  return null
}
