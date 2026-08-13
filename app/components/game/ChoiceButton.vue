<script setup lang="ts">
defineProps<{
  name: string
  imagePath: string | null
  subtitle?: string
  disabled?: boolean
}>()
const emit = defineEmits<{ select: [] }>()
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center gap-3 border border-border bg-surface p-2 text-left transition-colors duration-[120ms] hover:border-accent focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-40"
    :disabled="disabled"
    @click="emit('select')"
  >
    <img
      v-if="imagePath"
      :src="imagePath"
      :alt="name"
      class="h-16 w-11 shrink-0 object-cover"
    >
    <div
      v-else
      class="h-16 w-11 shrink-0 border border-border"
    />
    <span class="flex flex-col">
      <span class="font-sans text-sm text-ink">{{ name }}</span>
      <span
        v-if="subtitle"
        class="font-mono text-xs text-ink-muted"
      >{{ subtitle }}</span>
    </span>
  </button>
</template>
