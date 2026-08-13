const TMDB_LANGUAGE_BY_LOCALE: Record<string, string> = {
  es: 'es-ES',
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-PT',
  it: 'it-IT',
}

export function toTmdbLanguage(locale: string): string {
  return TMDB_LANGUAGE_BY_LOCALE[locale] ?? 'es-ES'
}
