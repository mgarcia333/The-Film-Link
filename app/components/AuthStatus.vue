<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()
</script>

<template>
  <div
    v-if="loggedIn"
    class="flex items-center gap-2"
  >
    <img
      v-if="user?.avatar"
      :src="user.avatar"
      :alt="user.name"
      class="h-6 w-6 border border-border object-cover"
    >
    <span class="font-sans text-xs text-ink-muted">{{ user?.name }}</span>
    <button
      type="button"
      class="font-mono text-xs text-ink-muted underline"
      @click="clear"
    >
      {{ $t('auth.signOut') }}
    </button>
  </div>
  <a
    v-else
    href="/auth/google"
    class="font-mono text-xs text-ink-muted underline"
  >
    {{ $t('auth.signIn') }}
  </a>
</template>
