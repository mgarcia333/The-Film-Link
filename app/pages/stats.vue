<script setup lang="ts">
const { locale } = useI18n()
const statsStore = useStatsStore()
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-12">
    <h1 class="font-heading text-lg uppercase tracking-widest text-ink">
      {{ $t('nav.stats') }}
    </h1>

    <dl class="grid grid-cols-2 gap-3">
      <div class="border border-border bg-surface p-3">
        <dt class="font-mono text-xs text-ink-muted">
          {{ $t('stats.currentStreak') }}
        </dt>
        <dd class="font-mono text-2xl tabular-nums text-ink">
          {{ formatNumber(statsStore.currentStreak, locale) }}
        </dd>
      </div>
      <div class="border border-border bg-surface p-3">
        <dt class="font-mono text-xs text-ink-muted">
          {{ $t('stats.longestStreak') }}
        </dt>
        <dd class="font-mono text-2xl tabular-nums text-ink">
          {{ formatNumber(statsStore.longestStreak, locale) }}
        </dd>
      </div>
      <div class="border border-border bg-surface p-3">
        <dt class="font-mono text-xs text-ink-muted">
          {{ $t('stats.played') }}
        </dt>
        <dd class="font-mono text-2xl tabular-nums text-ink">
          {{ formatNumber(statsStore.totalPlayed, locale) }}
        </dd>
      </div>
      <div class="border border-border bg-surface p-3">
        <dt class="font-mono text-xs text-ink-muted">
          {{ $t('stats.won') }}
        </dt>
        <dd class="font-mono text-2xl tabular-nums text-ink">
          {{ formatNumber(statsStore.totalWon, locale) }}
        </dd>
      </div>
    </dl>

    <NuxtLink
      to="/"
      class="font-sans text-sm text-accent underline"
    >
      {{ $t('common.backHome') }}
    </NuxtLink>
  </main>
</template>
