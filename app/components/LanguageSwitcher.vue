<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement
  setLocale(target.value as typeof locale.value)
}
</script>

<template>
  <span class="relative inline-flex items-center">
    <select
      :value="locale"
      class="cursor-pointer appearance-none bg-transparent pr-3 font-mono text-xs text-ink-muted underline transition-colors duration-[120ms] hover:text-ink"
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
    <span
      aria-hidden="true"
      class="pointer-events-none absolute right-0 font-mono text-[10px] text-ink-muted"
    >▾</span>
  </span>
</template>
