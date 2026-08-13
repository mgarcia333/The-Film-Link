<script setup lang="ts">
import type { TmdbMovieSummary } from '~~/types/tmdb'

definePageMeta({ ssr: false })

interface DailyChallengeResponse {
  date: string
  source: TmdbMovieSummary
  destination: TmdbMovieSummary
}

const { locale } = useI18n()
const gameStore = useGameStore()
const statsStore = useStatsStore()

const today = new Date().toISOString().slice(0, 10)
const alreadyPlayedToday = computed(() => Boolean(statsStore.history[today]))

const pending = ref(true)
const errorCode = ref<string | null>(null)

onMounted(async () => {
  if (gameStore.mode === 'daily' && gameStore.dailyChallengeDate === today && gameStore.status && gameStore.status !== 'playing') {
    await navigateTo('/play/result')
    return
  }

  if (alreadyPlayedToday.value) {
    pending.value = false
    return
  }

  try {
    const daily = await $fetch<DailyChallengeResponse>('/api/challenge/daily', {
      query: { lang: toTmdbLanguage(locale.value) },
    })
    gameStore.startGame(daily.source, daily.destination, 'daily', daily.date)
    await navigateTo('/play/game')
  }
  catch {
    errorCode.value = 'UNKNOWN'
  }
  finally {
    pending.value = false
  }
})
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
    <template v-if="alreadyPlayedToday">
      <p class="font-sans text-sm text-ink-muted">
        {{ $t('daily.alreadyPlayed') }}
      </p>
      <div class="flex items-center gap-4">
        <NuxtLink
          to="/stats"
          class="font-sans text-sm text-accent underline"
        >
          {{ $t('nav.stats') }}
        </NuxtLink>
        <NuxtLink
          to="/"
          class="font-sans text-sm text-accent underline"
        >
          {{ $t('common.backHome') }}
        </NuxtLink>
      </div>
    </template>
    <p
      v-else-if="pending"
      class="font-sans text-sm text-ink-muted"
    >
      {{ $t('daily.preparing') }}
    </p>
    <template v-else-if="errorCode">
      <p class="font-sans text-sm text-danger">
        {{ $t('daily.loadFailed') }}
      </p>
      <NuxtLink
        to="/"
        class="font-sans text-sm text-accent underline"
      >
        {{ $t('common.backHome') }}
      </NuxtLink>
    </template>
  </main>
</template>
