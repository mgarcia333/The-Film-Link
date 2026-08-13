// Single source of truth for the difficulty tiers, used by the client
// (game store, difficulty picker) and the server (pool config, generation)
// alike - see server/utils/difficulty-challenge/generate.ts for what each
// tier actually means in terms of film fame and path depth.
export type DifficultyLevel = 'easy' | 'normal' | 'difficult'
