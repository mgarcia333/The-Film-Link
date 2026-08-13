<script setup lang="ts">
const statsStore = useStatsStore()
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-12">
    <h1 class="font-heading text-lg uppercase tracking-widest text-ink">
      estadísticas
    </h1>

    <dl class="grid grid-cols-2 gap-3">
      <div class="border border-border bg-surface p-3">
        <dt class="font-mono text-xs text-ink-muted">
          racha actual
        </dt>
        <dd class="font-mono text-2xl tabular-nums text-ink">
          {{ statsStore.currentStreak }}
        </dd>
      </div>
      <div class="border border-border bg-surface p-3">
        <dt class="font-mono text-xs text-ink-muted">
          mejor racha
        </dt>
        <dd class="font-mono text-2xl tabular-nums text-ink">
          {{ statsStore.longestStreak }}
        </dd>
      </div>
      <div class="border border-border bg-surface p-3">
        <dt class="font-mono text-xs text-ink-muted">
          jugados
        </dt>
        <dd class="font-mono text-2xl tabular-nums text-ink">
          {{ statsStore.totalPlayed }}
        </dd>
      </div>
      <div class="border border-border bg-surface p-3">
        <dt class="font-mono text-xs text-ink-muted">
          ganados
        </dt>
        <dd class="font-mono text-2xl tabular-nums text-ink">
          {{ statsStore.totalWon }}
        </dd>
      </div>
    </dl>

    <NuxtLink
      to="/"
      class="font-sans text-sm text-accent underline"
    >
      volver al inicio
    </NuxtLink>
  </main>
</template>
