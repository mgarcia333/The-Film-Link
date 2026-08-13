<script setup lang="ts">
import type { GamePathNode } from '~/stores/game'

// The cast-sheet signature element: person on the left, film on the right,
// joined by a dot leader on the same line (like an index/credits listing).
// Rows stack downward as the path grows. The highlight color is reserved
// for the currently active step and for steps that match the optimal path.
const props = defineProps<{
  path: GamePathNode[]
  highlightedIds?: Set<string>
  highlightActive?: boolean
}>()
const { locale } = useI18n()

interface StepRow {
  index: number
  person: GamePathNode | null
  movie: GamePathNode | null
}

function nodeKey(node: GamePathNode): string {
  return `${node.kind}:${node.id}`
}

const sourceMovie = computed(() => props.path[0] ?? null)

const activeKey = computed(() => {
  const lastNode = props.path[props.path.length - 1]
  if (!props.highlightActive || !lastNode) {
    return null
  }
  return nodeKey(lastNode)
})

const steps = computed<StepRow[]>(() => {
  const rows: StepRow[] = []
  let stepIndex = 0
  for (let i = 1; i < props.path.length; i += 2) {
    const person = props.path[i] ?? null
    const movie = props.path[i + 1] ?? null
    if (!person && !movie) {
      continue
    }
    stepIndex++
    rows.push({ index: stepIndex, person, movie })
  }
  return rows
})

function nodeClass(node: GamePathNode | null): string {
  if (!node) {
    return 'text-ink-muted'
  }
  const key = nodeKey(node)
  if (key === activeKey.value || props.highlightedIds?.has(key)) {
    return 'text-highlight'
  }
  return 'text-ink'
}

function thumbnail(node: GamePathNode | null): string | null {
  return node ? tmdbImageUrl(node.imagePath, 'w92') : null
}
</script>

<template>
  <div class="flex flex-col border border-border bg-surface">
    <div
      v-if="sourceMovie"
      class="flex items-center gap-2 px-3 py-2"
      :class="{ 'border-b border-dotted border-border': steps.length > 0 }"
    >
      <span class="shrink-0 font-mono text-xs text-ink-muted">{{ $t('search.salidaLabel') }}</span>
      <span
        aria-hidden="true"
        class="min-w-2 flex-1 border-b border-dotted border-border"
      />
      <span
        class="max-w-[55%] shrink truncate text-right font-sans text-sm transition-colors duration-[120ms]"
        :class="nodeClass(sourceMovie)"
      >{{ sourceMovie.name }}</span>
      <img
        v-if="thumbnail(sourceMovie)"
        :src="thumbnail(sourceMovie) ?? undefined"
        :alt="sourceMovie.name"
        class="h-9 w-9 shrink-0 border border-border object-cover"
      >
    </div>

    <div
      v-for="step in steps"
      :key="step.index"
      class="flex items-center gap-2 border-b border-dotted border-border px-3 py-2 last:border-b-0"
    >
      <span class="w-4 shrink-0 font-mono text-xs text-ink-muted">{{ formatNumber(step.index, locale) }}</span>
      <img
        v-if="thumbnail(step.person)"
        :src="thumbnail(step.person) ?? undefined"
        :alt="step.person?.name"
        class="h-9 w-9 shrink-0 border border-border object-cover"
      >
      <span
        class="max-w-[32%] shrink truncate font-sans text-sm transition-colors duration-[120ms]"
        :class="nodeClass(step.person)"
      >{{ step.person?.name }}</span>
      <span
        aria-hidden="true"
        class="min-w-2 flex-1 border-b border-dotted border-border"
      />
      <span
        class="max-w-[32%] shrink truncate text-right font-sans text-sm transition-colors duration-[120ms]"
        :class="nodeClass(step.movie)"
      >{{ step.movie?.name }}</span>
      <img
        v-if="thumbnail(step.movie)"
        :src="thumbnail(step.movie) ?? undefined"
        :alt="step.movie?.name"
        class="h-9 w-9 shrink-0 border border-border object-cover"
      >
    </div>
  </div>
</template>
