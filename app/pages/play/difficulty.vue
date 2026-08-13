<script setup lang="ts">
import type { DifficultyLevel } from '~~/types/difficulty'

definePageMeta({ ssr: false })

const { locale } = useI18n()
const gameStore = useGameStore()

const pending = ref(false)
const pendingDifficulty = ref<DifficultyLevel | null>(null)
const errorCode = ref<string | null>(null)

async function startGame(difficulty: DifficultyLevel) {
  pending.value = true
  pendingDifficulty.value = difficulty
  errorCode.value = null

  try {
    const challenge = await $fetch('/api/challenge/difficulty', {
      query: { difficulty, lang: toTmdbLanguage(locale.value) },
    })
    gameStore.startGame(challenge.source, challenge.destination, 'difficulty', null, difficulty)
    await navigateTo('/play/game')
  }
  catch {
    errorCode.value = 'UNKNOWN'
  }
  finally {
    pending.value = false
    pendingDifficulty.value = null
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
        type="button"
        class="border border-border bg-surface px-4 py-3 text-center font-heading text-sm uppercase tracking-widest text-ink transition-colors duration-[120ms] enabled:hover:border-accent enabled:hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="pending"
        @click="startGame('easy')"
      >
        {{ pendingDifficulty === 'easy' ? $t('difficulty.loading') : $t('difficulty.easy') }}
      </button>
      <button
        type="button"
        class="border border-border bg-surface px-4 py-3 text-center font-heading text-sm uppercase tracking-widest text-ink transition-colors duration-[120ms] enabled:hover:border-accent enabled:hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="pending"
        @click="startGame('normal')"
      >
        {{ pendingDifficulty === 'normal' ? $t('difficulty.loading') : $t('difficulty.normal') }}
      </button>
      <button
        type="button"
        class="border border-border bg-surface px-4 py-3 text-center font-heading text-sm uppercase tracking-widest text-ink transition-colors duration-[120ms] enabled:hover:border-accent enabled:hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="pending"
        @click="startGame('difficult')"
      >
        {{ pendingDifficulty === 'difficult' ? $t('difficulty.loading') : $t('difficulty.difficult') }}
      </button>
    </div>

    <p
      v-if="errorCode"
      class="font-sans text-sm text-danger"
    >
      {{ $t('difficulty.loadFailed') }}
    </p>
  </main>
</template>
