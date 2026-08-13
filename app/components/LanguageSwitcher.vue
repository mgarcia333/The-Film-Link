<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement
  setLocale(target.value as typeof locale.value)
}
</script>

<template>
  <select
    :value="locale"
    class="border border-border bg-surface px-2 py-1 font-mono text-xs text-ink-muted"
    @change="onChange"
  >
    <option
      v-for="loc in locales"
      :key="loc.code"
      :value="loc.code"
    >
      {{ loc.name }}
    </option>
  </select>
</template>
