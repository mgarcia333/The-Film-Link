<script setup lang="ts">
import type { TmdbMovieSummary } from '~~/types/tmdb'

const { label } = defineProps<{ label: string }>()
const selected = defineModel<TmdbMovieSummary | null>({ default: null })

const { locale } = useI18n()
const inputId = useId()
const query = ref('')
const showResults = ref(false)
const { results, pending, failed, search, clear } = useMovieSearch()

function onInput() {
  showResults.value = true
  search(query.value)
}

function pick(movie: TmdbMovieSummary) {
  selected.value = movie
  showResults.value = false
  clear()
}

function changeSelection() {
  selected.value = null
  query.value = ''
  showResults.value = false
  clear()
}

function releaseYear(movie: TmdbMovieSummary): string {
  return movie.release_date ? formatYear(Number(movie.release_date.slice(0, 4)), locale.value) : ''
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label
      :for="inputId"
      class="font-heading text-xs uppercase tracking-widest text-ink-muted"
    >{{ label }}</label>

    <div
      v-if="selected"
      class="flex items-center gap-3 border border-border bg-surface p-2"
    >
      <img
        v-if="tmdbImageUrl(selected.poster_path, 'w92')"
        :src="tmdbImageUrl(selected.poster_path, 'w92') ?? undefined"
        :alt="selected.title"
        class="h-16 w-11 object-cover"
      >
      <div
        v-else
        class="h-16 w-11 shrink-0 border border-border"
      />
      <div class="flex-1">
        <p class="font-sans text-sm text-ink">
          {{ selected.title }}
        </p>
        <p class="font-mono text-xs text-ink-muted">
          {{ releaseYear(selected) }}
        </p>
      </div>
      <button
        type="button"
        class="font-sans text-xs text-accent underline"
        @click="changeSelection"
      >
        {{ $t('search.change') }}
      </button>
    </div>

    <div
      v-else
      class="relative"
    >
      <input
        :id="inputId"
        v-model="query"
        type="text"
        autocomplete="off"
        class="w-full border border-border bg-surface px-3 py-2 font-sans text-sm text-ink outline-none focus:border-accent"
        @input="onInput"
        @focus="showResults = true"
      >

      <ul
        v-if="showResults && (results.length > 0 || pending || failed || query.trim())"
        class="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto border border-border bg-surface"
      >
        <li
          v-if="pending"
          class="px-3 py-2 font-sans text-xs text-ink-muted"
        >
          {{ $t('search.searching') }}
        </li>
        <li
          v-else-if="failed"
          class="px-3 py-2 font-sans text-xs text-danger"
        >
          {{ $t('search.searchFailed') }}
        </li>
        <li
          v-else-if="results.length === 0"
          class="px-3 py-2 font-sans text-xs text-ink-muted"
        >
          {{ $t('search.noResults') }}
        </li>
        <li
          v-for="movie in results"
          :key="movie.id"
        >
          <button
            type="button"
            class="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-bg focus-visible:bg-bg"
            @click="pick(movie)"
          >
            <img
              v-if="tmdbImageUrl(movie.poster_path, 'w92')"
              :src="tmdbImageUrl(movie.poster_path, 'w92') ?? undefined"
              :alt="movie.title"
              class="h-12 w-8 object-cover"
            >
            <div
              v-else
              class="h-12 w-8 shrink-0 border border-border"
            />
            <div>
              <p class="font-sans text-sm text-ink">
                {{ movie.title }}
              </p>
              <p class="font-mono text-xs text-ink-muted">
                {{ releaseYear(movie) }}
              </p>
            </div>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
