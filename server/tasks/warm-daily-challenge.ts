import { DAILY_CHALLENGE_GENERATION_LANGUAGE, getDailyChallenge } from '../utils/daily-challenge/generate'

export default defineTask({
  meta: {
    name: 'warm-daily-challenge',
    description: 'Precomputes today\'s daily challenge so the first visitor of the day does not pay the cost.',
  },
  async run() {
    const date = new Date().toISOString().slice(0, 10)
    // Warms the canonical, language-independent entry; per-locale display
    // titles are cheap to localize on demand from there.
    await getDailyChallenge(date, DAILY_CHALLENGE_GENERATION_LANGUAGE)
    return { result: { date } }
  },
})
