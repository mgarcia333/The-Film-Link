import type { DifficultyLevel } from '~~/types/difficulty'
import { type DifficultyChallenge, generateDifficultyChallenge } from './generate'

const KV_MOUNT = 'gameKv'
// How many ready-to-serve challenges each tier keeps on hand. Small on
// purpose: this only needs to absorb the gap between a player clicking and
// the next background refill landing, not act as a long-term cache.
const POOL_SIZE = 3

function poolKey(difficulty: DifficultyLevel): string {
  return `difficulty-ready-pool:${difficulty}`
}

async function readPool(difficulty: DifficultyLevel): Promise<DifficultyChallenge[]> {
  const pool = await useStorage(KV_MOUNT).getItem<DifficultyChallenge[]>(poolKey(difficulty))
  return pool ?? []
}

async function writePool(difficulty: DifficultyLevel, pool: DifficultyChallenge[]): Promise<void> {
  await useStorage(KV_MOUNT).setItem(poolKey(difficulty), pool)
}

// Takes one ready-made challenge off the front of the pool, if any is
// available. Not perfectly race-safe under concurrent pops - Cloudflare KV
// has no compare-and-swap, the same trade-off acknowledged for acquireLock
// in kv-cache.ts - but the worst case here is two players occasionally
// getting the same pair, which is harmless for this game.
export async function popFromPool(difficulty: DifficultyLevel): Promise<DifficultyChallenge | null> {
  const pool = await readPool(difficulty)
  const next = pool[0]
  if (!next) {
    return null
  }
  await writePool(difficulty, pool.slice(1))
  return next
}

// Tops a tier's pool back up to POOL_SIZE, generating and writing one
// challenge at a time so a later failure never throws away earlier
// progress. Meant to run after a response has already been sent (via
// event.waitUntil) or from the scheduled warm task - never inline in a
// request a player is waiting on, since each generation can take several
// seconds and make dozens of TMDB calls.
export async function refillPool(difficulty: DifficultyLevel, signal?: AbortSignal): Promise<void> {
  for (let pool = await readPool(difficulty); pool.length < POOL_SIZE; pool = await readPool(difficulty)) {
    const challenge = await generateDifficultyChallenge(difficulty, signal).catch(() => null)
    if (!challenge) {
      return
    }
    // Re-read before appending: another request may have refilled or
    // popped from this same tier while this generation was in flight.
    const current = await readPool(difficulty)
    if (current.length >= POOL_SIZE) {
      return
    }
    await writePool(difficulty, [...current, challenge])
  }
}
