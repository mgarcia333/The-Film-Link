export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value)
}

// Years shouldn't get thousands separators (e.g. "1,999").
export function formatYear(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { useGrouping: false }).format(value)
}
