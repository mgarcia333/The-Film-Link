import { defineStore } from 'pinia'

export interface DailyResult {
  status: 'won' | 'surrendered'
  stepsTaken: number
  optimalStepCount: number
}

interface StatsState {
  // Keyed by UTC date ('YYYY-MM-DD').
  history: Record<string, DailyResult>
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function toUtcMidnight(date: string): number {
  return new Date(`${date}T00:00:00Z`).getTime()
}

export const useStatsStore = defineStore('stats', {
  state: (): StatsState => ({ history: {} }),

  getters: {
    totalPlayed: (state): number => Object.keys(state.history).length,
    totalWon: (state): number => Object.values(state.history).filter(entry => entry.status === 'won').length,

    // Consecutive won days ending at the most recently played date.
    currentStreak: (state): number => {
      const dates = Object.keys(state.history).sort()
      let streak = 0
      let expectedTime: number | null = null

      for (let i = dates.length - 1; i >= 0; i--) {
        const date = dates[i]!
        if (state.history[date]!.status !== 'won') {
          break
        }
        const time = toUtcMidnight(date)
        if (expectedTime !== null && expectedTime - time !== MS_PER_DAY) {
          break
        }
        streak++
        expectedTime = time
      }

      return streak
    },

    longestStreak: (state): number => {
      const dates = Object.keys(state.history).sort()
      let longest = 0
      let current = 0
      let previousTime: number | null = null

      for (const date of dates) {
        if (state.history[date]!.status !== 'won') {
          current = 0
          previousTime = null
          continue
        }
        const time = toUtcMidnight(date)
        current = previousTime !== null && time - previousTime === MS_PER_DAY ? current + 1 : 1
        longest = Math.max(longest, current)
        previousTime = time
      }

      return longest
    },
  },

  actions: {
    recordResult(date: string, result: DailyResult) {
      // Idempotent: a page refresh on /play/result must not double-record.
      if (this.history[date]) {
        return
      }
      this.history[date] = result
    },
  },

  persist: true,
})
