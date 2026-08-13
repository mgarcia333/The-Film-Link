<script setup lang="ts">
const { locale } = useI18n()
const preferences = usePreferencesStore()

useHead({
  htmlAttrs: {
    'lang': locale,
    'data-theme': computed(() => preferences.theme ?? undefined),
  },
})
</script>

<template>
  <div class="min-h-dvh bg-bg font-sans text-ink">
    <NuxtRouteAnnouncer />
    <header class="sticky top-0 z-10 border-b border-border bg-bg">
      <div class="mx-auto flex max-w-md flex-col items-center gap-2 px-4 py-3">
        <NuxtLink
          to="/"
          class="font-heading text-xs uppercase tracking-widest text-ink-muted transition-colors duration-[120ms] hover:text-ink"
        >
          the film link
        </NuxtLink>
        <div class="flex items-center gap-3">
          <AuthStatus />
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
    <NuxtPage />
  </div>
</template>
