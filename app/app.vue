<script setup lang="ts">
const { locale } = useI18n()

useHead({
  htmlAttrs: {
    lang: locale,
  },
})
</script>

<template>
  <div class="min-h-dvh bg-bg font-sans text-ink">
    <NuxtRouteAnnouncer />
    <header class="flex justify-end p-2">
      <LanguageSwitcher />
    </header>
    <NuxtPage />
  </div>
</template>
