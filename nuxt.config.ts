import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
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
})
