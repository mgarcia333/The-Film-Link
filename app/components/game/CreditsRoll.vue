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
</script>

<template>
  <div class="flex flex-col border border-border bg-surface">
    <div
      v-if="sourceMovie"
      class="flex items-baseline gap-2 px-3 py-2"
      :class="{ 'border-b border-dotted border-border': steps.length > 0 }"
    >
      <span class="shrink-0 font-mono text-xs text-ink-muted">{{ $t('search.salidaLabel') }}</span>
      <span
        aria-hidden="true"
        class="min-w-2 flex-1 -translate-y-1 border-b border-dotted border-border"
      />
      <span
        class="max-w-[60%] shrink truncate text-right font-sans text-sm transition-colors duration-[120ms]"
        :class="nodeClass(sourceMovie)"
      >{{ sourceMovie.name }}</span>
    </div>

    <div
      v-for="step in steps"
      :key="step.index"
      class="flex items-baseline gap-2 border-b border-dotted border-border px-3 py-2 last:border-b-0"
    >
      <span class="w-5 shrink-0 font-mono text-xs text-ink-muted">{{ formatNumber(step.index, locale) }}</span>
      <span
        class="max-w-[38%] shrink truncate font-sans text-sm transition-colors duration-[120ms]"
        :class="nodeClass(step.person)"
      >{{ step.person?.name }}</span>
      <span
        aria-hidden="true"
        class="min-w-2 flex-1 -translate-y-1 border-b border-dotted border-border"
      />
      <span
        class="max-w-[38%] shrink truncate text-right font-sans text-sm transition-colors duration-[120ms]"
        :class="nodeClass(step.movie)"
      >{{ step.movie?.name }}</span>
    </div>
  </div>
</template>
