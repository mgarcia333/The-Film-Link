<script setup lang="ts">
import type { TmdbMovieSummary } from '~~/types/tmdb'

definePageMeta({ ssr: false })

const source = ref<TmdbMovieSummary | null>(null)
const destination = ref<TmdbMovieSummary | null>(null)
const sameMovieSelected = computed(() => Boolean(source.value && destination.value && source.value.id === destination.value.id))
const notConnected = ref(false)

const { pending, errorCode, validate, cancel } = useChallengeValidation()
const gameStore = useGameStore()

const canStart = computed(() => Boolean(source.value && destination.value) && !sameMovieSelected.value && !pending.value)

async function start() {
  if (!source.value || !destination.value || sameMovieSelected.value) {
    return
  }
  notConnected.value = false

  const connected = await validate(source.value, destination.value)
  if (!connected) {
    if (!errorCode.value) {
      notConnected.value = true
    }
    return
  }

  gameStore.startGame(source.value, destination.value, 'personalized')
  await navigateTo('/play/game')
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-12">
    <header class="flex flex-col gap-2">
      <h1 class="font-heading text-lg uppercase tracking-widest text-ink">
        reto personalizado
      </h1>
      <p class="font-sans text-sm text-ink-muted">
        elige la película de salida y la película de destino.
      </p>
    </header>

    <MovieSearchField
      v-model="source"
      label="salida"
    />
    <MovieSearchField
      v-model="destination"
      label="destino"
    />

    <p
      v-if="sameMovieSelected"
      class="font-sans text-sm text-danger"
    >
      elige dos películas distintas.
    </p>
    <p
      v-else-if="notConnected"
      class="font-sans text-sm text-danger"
    >
      estas dos películas no tienen conexión en tres saltos. prueba con otra.
    </p>
    <p
      v-else-if="errorCode"
      class="font-sans text-sm text-danger"
    >
      no se ha podido comprobar la conexión. inténtalo de nuevo.
    </p>

    <div class="flex items-center gap-3">
      <button
        type="button"
        class="flex-1 border border-border bg-surface px-4 py-3 font-heading text-sm uppercase tracking-widest text-ink transition-colors duration-[120ms] enabled:hover:border-accent enabled:hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!canStart"
        @click="start"
      >
        {{ pending ? 'comprobando conexión...' : 'empezar' }}
      </button>
      <button
        v-if="pending"
        type="button"
        class="border border-border bg-surface px-4 py-3 font-sans text-sm text-ink-muted"
        @click="cancel"
      >
        cancelar
      </button>
    </div>
  </main>
</template>
