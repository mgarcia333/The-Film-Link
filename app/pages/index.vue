<script setup lang="ts">
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-12">
    <header class="flex flex-col gap-2 text-center">
      <h1 class="font-heading text-2xl uppercase tracking-widest text-ink">
        the film link
      </h1>
      <p class="font-sans text-sm text-ink-muted">
        conecta dos películas encadenando reparto y dirección, en el menor número de pasos posible.
      </p>
    </header>

    <nav class="flex flex-col gap-3">
      <NuxtLink
        to="/play/daily"
        class="border border-border bg-surface px-4 py-3 text-center font-heading text-sm uppercase tracking-widest text-ink transition-colors duration-[120ms] hover:border-accent hover:text-accent focus-visible:border-accent"
      >
        reto diario
      </NuxtLink>
      <NuxtLink
        to="/play/personalized"
        class="border border-border bg-surface px-4 py-3 text-center font-heading text-sm uppercase tracking-widest text-ink transition-colors duration-[120ms] hover:border-accent hover:text-accent focus-visible:border-accent"
      >
        reto personalizado
      </NuxtLink>
      <NuxtLink
        to="/stats"
        class="text-center font-sans text-xs uppercase tracking-widest text-ink-muted transition-colors duration-[120ms] hover:text-ink"
      >
        estadísticas
      </NuxtLink>
    </nav>
  </main>
</template>
