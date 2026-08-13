import type { ThemePreference } from '~/stores/preferences'

// The visual theme itself is applied CSS-only (prefers-color-scheme plus an
// optional data-theme override, see app/assets/css/main.css) so the page
// never flashes the wrong theme. This composable only tracks which mode is
// currently in effect, for UI that needs to display or toggle it.
export function useEffectiveTheme() {
  const preferences = usePreferencesStore()
  const systemPrefersDark = ref(false)

  onMounted(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemPrefersDark.value = mediaQuery.matches

    const listener = (event: MediaQueryListEvent) => {
      systemPrefersDark.value = event.matches
    }
    mediaQuery.addEventListener('change', listener)
    onScopeDispose(() => mediaQuery.removeEventListener('change', listener))
  })

  const effectiveTheme = computed<ThemePreference>(() => preferences.theme ?? (systemPrefersDark.value ? 'dark' : 'light'))

  return { effectiveTheme }
}
