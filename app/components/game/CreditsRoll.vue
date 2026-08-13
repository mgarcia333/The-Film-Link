<script setup lang="ts">
import type { GamePathNode } from '~/stores/game'

// A functional first pass at the credits-roll layout described in the art
// direction brief (person on the left, movie on the right per step). The
// signature vertical-roll animation and stacking treatment land later.
const { path } = defineProps<{ path: GamePathNode[] }>()
const { locale } = useI18n()

interface StepRow {
  person: GamePathNode
  movie: GamePathNode
}

const sourceMovie = computed(() => path[0] ?? null)

const steps = computed<StepRow[]>(() => {
  const rows: StepRow[] = []
  for (let i = 1; i < path.length; i += 2) {
    const person = path[i]
    const movie = path[i + 1]
    if (person && movie) {
      rows.push({ person, movie })
    }
  }
  return rows
})
</script>

<template>
  <div class="flex flex-col border border-border bg-surface">
    <div
      v-if="sourceMovie"
      class="border-b border-dotted border-border px-3 py-2"
    >
      <p class="font-mono text-xs text-ink-muted">
        {{ $t('search.salidaLabel') }}
      </p>
      <p class="font-sans text-sm text-ink">
        {{ sourceMovie.name }}
      </p>
    </div>
    <div
      v-for="(step, index) in steps"
      :key="`${step.person.id}-${step.movie.id}`"
      class="flex items-center justify-between gap-3 border-b border-dotted border-border px-3 py-2 last:border-b-0"
    >
      <span class="w-6 shrink-0 font-mono text-xs text-ink-muted">{{ formatNumber(index + 1, locale) }}</span>
      <span class="flex-1 font-sans text-sm text-ink">{{ step.person.name }}</span>
      <span class="flex-1 text-right font-sans text-sm text-ink">{{ step.movie.name }}</span>
    </div>
  </div>
</template>
