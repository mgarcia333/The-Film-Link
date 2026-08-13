import { defineStore } from 'pinia'

export type ThemePreference = 'light' | 'dark'

interface PreferencesState {
  // null = no explicit choice yet, follow the system's prefers-color-scheme.
  theme: ThemePreference | null
}

export const usePreferencesStore = defineStore('preferences', {
  state: (): PreferencesState => ({ theme: null }),

  actions: {
    setTheme(theme: ThemePreference) {
      this.theme = theme
    },
  },

  persist: true,
})
