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

const gameStore = useGameStore()
const { pending, failed, loadMovieOptions, loadPersonOptions } = useNodeOptions()

if (!gameStore.status) {
  await navigateTo('/')
}

const options = ref<Option[]>([])
const visitedMovieIds = computed(() => new Set(gameStore.playedPath.filter(node => node.kind === 'movie').map(node => node.id)))

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
      subtitle: person.creditedAs === 'director' ? 'dirección' : 'reparto',
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
      subtitle: String(movie.releaseYear),
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
    class="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-8"
  >
    <header class="flex items-center justify-between">
      <div>
        <p class="font-mono text-xs text-ink-muted">
          {{ gameStore.currentNode?.kind === 'movie' ? 'estás en' : 'has elegido a' }}
        </p>
        <p class="font-sans text-base text-ink">
          {{ gameStore.currentNode?.name }}
        </p>
      </div>
      <p class="font-mono text-2xl tabular-nums text-ink">
        {{ gameStore.stepsTaken }}
      </p>
    </header>

    <div class="flex items-center gap-3">
      <button
        type="button"
        class="border border-border bg-surface px-3 py-2 font-sans text-xs uppercase tracking-widest text-ink-muted transition-colors duration-[120ms] enabled:hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!gameStore.canUndo"
        @click="undo"
      >
        deshacer
      </button>
      <button
        type="button"
        class="border border-border bg-surface px-3 py-2 font-sans text-xs uppercase tracking-widest text-danger transition-colors duration-[120ms] hover:opacity-80"
        @click="surrender"
      >
        rendirse
      </button>
    </div>

    <p class="font-sans text-sm text-ink-muted">
      destino: {{ gameStore.destinationMovie?.title }}
    </p>

    <div class="flex flex-col gap-2">
      <p
        v-if="pending"
        class="font-sans text-sm text-ink-muted"
      >
        cargando opciones...
      </p>
      <p
        v-else-if="failed"
        class="font-sans text-sm text-danger"
      >
        no se han podido cargar las opciones. inténtalo de nuevo.
      </p>
      <p
        v-else-if="options.length === 0"
        class="font-sans text-sm text-ink-muted"
      >
        no hay opciones disponibles aquí.
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
