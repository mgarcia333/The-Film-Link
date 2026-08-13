import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
  ],

  components: [
    { path: '~/components', pathPrefix: false },
  ],

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    tmdbApiKey: '',
  },

  compatibilityDate: '2025-07-15',

  nitro: {
    preset: 'cloudflare_module',
    storage: {
      gameKv: {
        driver: 'cloudflare-kv-binding',
        binding: 'GAME_KV',
      },
    },
    experimental: {
      tasks: true,
    },
    // Optional: precomputes the daily challenge shortly after UTC midnight
    // so the first visitor doesn't pay the generation cost. Not required -
    // getDailyChallenge() also generates lazily on first request.
    scheduledTasks: {
      '5 0 * * *': ['warm-daily-challenge'],
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  typescript: {
    strict: true,
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  i18n: {
    defaultLocale: 'es',
    strategy: 'no_prefix',
    locales: [
      { code: 'es', language: 'es-ES', name: 'Español', file: 'es.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'fr', language: 'fr-FR', name: 'Français', file: 'fr.json' },
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'pt', language: 'pt-PT', name: 'Português', file: 'pt.json' },
      { code: 'it', language: 'it-IT', name: 'Italiano', file: 'it.json' },
    ],
    // Persisted via i18n's own cookie (not Pinia): locale must be known
    // before SSR renders, and localStorage isn't available at that point.
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root',
    },
  },
})
