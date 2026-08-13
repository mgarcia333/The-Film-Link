<script setup lang="ts">
const preferences = usePreferencesStore()
const { effectiveTheme } = useEffectiveTheme()

function toggle() {
  preferences.setTheme(effectiveTheme.value === 'dark' ? 'light' : 'dark')
}
</script>

<template>
  <button
    type="button"
    class="border border-border bg-surface px-2 py-1 font-mono text-xs text-ink-muted transition-colors duration-[120ms] hover:text-ink"
    @click="toggle"
  >
    {{ effectiveTheme === 'dark' ? $t('theme.dark') : $t('theme.light') }}
  </button>
</template>
