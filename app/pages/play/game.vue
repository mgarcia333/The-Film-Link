<script setup lang="ts">
definePageMeta({ ssr: false })

interface Option {
  kind: 'person' | 'movie'
  id: number
  name: string
  imagePath: string | null
  subtitle: string
  used: boolean
}

const { t, locale } = useI18n()
const gameStore = useGameStore()
const { pending, failed, loadMovieOptions, loadPersonOptions } = useNodeOptions()
const { reveal } = useChallengeReveal()

if (!gameStore.status) {
  await navigateTo('/')
}

// Computed the moment the pair is known instead of when the player
// finishes, so the result screen almost never has to wait for it - the
// path only depends on source/destination, never on how the player gets
// there, so there's nothing to invalidate by playing on.
onMounted(() => {
  const { status, optimalPath, sourceMovie, destinationMovie } = gameStore
  if (status === 'playing' && !optimalPath && sourceMovie && destinationMovie) {
    reveal(sourceMovie, destinationMovie).then((result) => {
      if (result.path && result.stepCount !== null) {
        gameStore.setOptimalPath(result.path, result.stepCount)
      }
    })
  }
})

const options = ref<Option[]>([])
const visitedMovieIds = computed(() => new Set(gameStore.playedPath.filter(node => node.kind === 'movie').map(node => node.id)))
const currentImageUrl = computed(() => tmdbImageUrl(gameStore.currentNode?.imagePath ?? null, 'w342'))

async function loadOptions() {
  const node = gameStore.currentNode
  if (!node || gameStore.status !== 'playing') {
    options.value = []
    return
  }

  if (node.kind === 'movie') {
    const people = await loadMovieOptions(node.id)
    const usedPersonIds = new Set(gameStore.usedPersonIds)
    options.value = people.map(person => ({
      kind: 'person' as const,
      id: person.id,
      name: person.name,
      imagePath: person.profilePath,
      subtitle: person.creditedAs === 'director' ? t('game.director') : t('game.cast'),
      used: usedPersonIds.has(person.id),
    }))
  }
  else {
    const movies = await loadPersonOptions(node.id)
    options.value = movies.map(movie => ({
      kind: 'movie' as const,
      id: movie.id,
      name: movie.title,
      imagePath: movie.posterPath,
      subtitle: formatYear(movie.releaseYear, locale.value),
      used: visitedMovieIds.value.has(movie.id),
    }))
  }
}

watch(() => gameStore.currentNode, loadOptions, { immediate: true })

async function choose(option: Option) {
  if (option.used) {
    return
  }
  gameStore.choose({ kind: option.kind, id: option.id, name: option.name, imagePath: option.imagePath })
  if (gameStore.status !== 'playing') {
    await navigateTo('/play/result')
  }
}

async function surrender() {
  gameStore.surrender()
  await navigateTo('/play/result')
}

async function undo() {
  gameStore.undo()
}
</script>

<template>
  <main
    v-if="gameStore.status === 'playing'"
    class="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 py-8"
  >
    <header class="flex items-start justify-between gap-3">
      <p class="font-sans text-sm text-ink-muted">
        {{ $t('game.destinationLabel', { title: gameStore.destinationMovie?.title }) }}
      </p>
      <p class="shrink-0 font-mono text-2xl tabular-nums text-ink">
        {{ formatNumber(gameStore.stepsTaken, locale) }}
      </p>
    </header>

    <div class="flex items-center gap-3">
      <img
        v-if="currentImageUrl"
        :src="currentImageUrl"
        :alt="gameStore.currentNode?.name"
        class="h-24 w-16 shrink-0 border border-border object-cover"
      >
      <div
        v-else
        class="h-24 w-16 shrink-0 border border-border"
      />
      <p class="font-sans text-sm text-ink-muted">
        {{ gameStore.currentNode?.kind === 'movie' ? $t('game.youAreAtMovie') : $t('game.youPicked') }}
        <span class="block font-heading text-lg text-highlight">{{ gameStore.currentNode?.name }}</span>
      </p>
    </div>

    <CreditsRoll
      :path="gameStore.playedPath"
      highlight-active
    />

    <div class="flex items-center gap-3">
      <button
        type="button"
        class="border border-border bg-surface px-3 py-2 font-sans text-xs uppercase tracking-widest text-ink-muted transition-colors duration-[120ms] enabled:hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!gameStore.canUndo"
        @click="undo"
      >
        {{ $t('game.undo') }}
      </button>
      <button
        type="button"
        class="border border-border bg-surface px-3 py-2 font-sans text-xs uppercase tracking-widest text-danger transition-colors duration-[120ms] hover:opacity-80"
        @click="surrender"
      >
        {{ $t('game.surrender') }}
      </button>
    </div>

    <div class="flex flex-col gap-2">
      <p
        v-if="pending"
        class="font-sans text-sm text-ink-muted"
      >
        {{ $t('game.loadingOptions') }}
      </p>
      <p
        v-else-if="failed"
        class="font-sans text-sm text-danger"
      >
        {{ $t('game.optionsFailed') }}
      </p>
      <p
        v-else-if="options.length === 0"
        class="font-sans text-sm text-ink-muted"
      >
        {{ $t('game.noOptions') }}
      </p>

      <ChoiceButton
        v-for="option in options"
        :key="`${option.kind}-${option.id}`"
        :name="option.name"
        :image-path="tmdbImageUrl(option.imagePath, 'w185')"
        :subtitle="option.subtitle"
        :disabled="option.used"
        @select="choose(option)"
      />
    </div>
  </main>
</template>
