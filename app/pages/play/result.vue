<script setup lang="ts">
definePageMeta({ ssr: false })

const { locale } = useI18n()
const gameStore = useGameStore()
const statsStore = useStatsStore()
const { pending, errorCode, reveal } = useChallengeReveal()

if (!gameStore.status || gameStore.status === 'playing') {
  await navigateTo('/')
}

onMounted(async () => {
  if (gameStore.optimalPath || !gameStore.sourceMovie || !gameStore.destinationMovie) {
    return
  }
  const result = await reveal(gameStore.sourceMovie, gameStore.destinationMovie)
  if (result.path && result.stepCount !== null) {
    gameStore.setOptimalPath(result.path, result.stepCount)
    const status = gameStore.status
    if (gameStore.mode === 'daily' && gameStore.dailyChallengeDate && (status === 'won' || status === 'surrendered')) {
      statsStore.recordResult(gameStore.dailyChallengeDate, {
        status,
        stepsTaken: gameStore.stepsTaken,
        optimalStepCount: result.stepCount,
      })
    }
  }
})

async function playAgain() {
  const wasDaily = gameStore.mode === 'daily'
  gameStore.reset()
  await navigateTo(wasDaily ? '/' : '/play/personalized')
}
</script>

<template>
  <main
    v-if="gameStore.status !== 'playing'"
    class="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-4 py-12"
  >
    <header class="flex flex-col gap-2 text-center">
      <h1 class="font-heading text-xl uppercase tracking-widest text-ink">
        {{ gameStore.status === 'won' ? $t('result.won') : $t('result.surrendered') }}
      </h1>
      <p class="font-mono text-sm text-ink-muted">
        {{ $t('result.stepsTaken') }}: <span class="tabular-nums text-ink">{{ formatNumber(gameStore.stepsTaken, locale) }}</span>
        <template v-if="gameStore.optimalStepCount !== null">
          · {{ $t('result.optimal') }}: <span class="tabular-nums text-ink">{{ formatNumber(gameStore.optimalStepCount, locale) }}</span>
        </template>
      </p>
    </header>

    <section class="flex flex-col gap-2">
      <h2 class="font-heading text-xs uppercase tracking-widest text-ink-muted">
        {{ $t('result.yourPath') }}
      </h2>
      <CreditsRoll :path="gameStore.playedPath" />
    </section>

    <section
      v-if="pending"
      class="font-sans text-sm text-ink-muted"
    >
      {{ $t('result.calculatingOptimal') }}
    </section>
    <section
      v-else-if="errorCode"
      class="font-sans text-sm text-danger"
    >
      {{ $t('result.optimalFailed') }}
    </section>
    <section
      v-else-if="gameStore.optimalPath"
      class="flex flex-col gap-2"
    >
      <h2 class="font-heading text-xs uppercase tracking-widest text-ink-muted">
        {{ $t('result.shortestPossible') }}
      </h2>
      <CreditsRoll :path="gameStore.optimalPath" />
    </section>

    <button
      type="button"
      class="border border-border bg-surface px-4 py-3 font-heading text-sm uppercase tracking-widest text-ink transition-colors duration-[120ms] hover:border-accent hover:text-accent"
      @click="playAgain"
    >
      {{ gameStore.mode === 'daily' ? $t('common.backHome') : $t('result.playAgain') }}
    </button>
  </main>
</template>
