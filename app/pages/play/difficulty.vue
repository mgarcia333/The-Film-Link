<script setup lang="ts">
definePageMeta({ ssr: false })

const { locale } = useI18n()
const gameStore = useGameStore()

const pending = ref(false)
const errorCode = ref<string | null>(null)
const selectedDifficulty = ref<DifficultyLevel | null>(null)

if (!gameStore.status) {
  // Fresh start
}

async function startGame(difficulty: DifficultyLevel) {
  selectedDifficulty.value = difficulty
  pending.value = true
  errorCode.value = null

  try {
    const challenge = await $fetch('/api/challenge/difficulty', {
      query: {
        difficulty,
        lang: toTmdbLanguage(locale.value),
      },
    })
    gameStore.startGame(challenge.source, challenge.destination, 'difficulty', null, difficulty)
    await navigateTo('/play/game')
  }
  catch (error) {
    errorCode.value = 'UNKNOWN'
    console.error('Failed to load difficulty challenge:', error)
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-12">
    <header class="flex flex-col gap-2">
      <h1 class="font-heading text-lg uppercase tracking-widest text-ink">
        {{ $t('nav.difficultyChallenge') }}
      </h1>
      <p class="font-sans text-sm text-ink-muted">
        {{ $t('difficulty.subtitle') }}
      </p>
    </header>

    <div class="flex flex-col gap-3">
      <button
        :disabled="pending"
        :class="{ 'opacity-50 cursor-not-allowed': pending }"
        class="border border-border bg-surface px-4 py-3 text-center font-heading text-sm uppercase tracking-widest text-ink transition-colors duration-[120ms] hover:border-accent hover:text-accent focus-visible:border-accent disabled:hover:border-border disabled:hover:text-ink"
        @click="startGame('easy')"
      >
        {{ selectedDifficulty === 'easy' && pending ? $t('difficulty.loading') : $t('difficulty.easy') }}
      </button>
      <button
        :disabled="pending"
        :class="{ 'opacity-50 cursor-not-allowed': pending }"
        class="border border-border bg-surface px-4 py-3 text-center font-heading text-sm uppercase tracking-widest text-ink transition-colors duration-[120ms] hover:border-accent hover:text-accent focus-visible:border-accent disabled:hover:border-border disabled:hover:text-ink"
        @click="startGame('normal')"
      >
        {{ selectedDifficulty === 'normal' && pending ? $t('difficulty.loading') : $t('difficulty.normal') }}
      </button>
      <button
        :disabled="pending"
        :class="{ 'opacity-50 cursor-not-allowed': pending }"
        class="border border-border bg-surface px-4 py-3 text-center font-heading text-sm uppercase tracking-widest text-ink transition-colors duration-[120ms] hover:border-accent hover:text-accent focus-visible:border-accent disabled:hover:border-border disabled:hover:text-ink"
        @click="startGame('difficult')"
      >
        {{ selectedDifficulty === 'difficult' && pending ? $t('difficulty.loading') : $t('difficulty.difficult') }}
      </button>
    </div>

    <div
      v-if="errorCode"
      class="rounded border border-error bg-surface/50 px-4 py-3 text-center text-sm text-error"
    >
      {{ $t('difficulty.loadFailed') }}
    </div>
  </main>
</template>
