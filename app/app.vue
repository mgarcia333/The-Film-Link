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
    <header class="flex items-center justify-end gap-3 p-2">
      <AuthStatus />
      <ThemeToggle />
      <LanguageSwitcher />
    </header>
    <NuxtPage />
  </div>
</template>
