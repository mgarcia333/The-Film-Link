import { getDailyChallenge } from '../utils/daily-challenge/generate'

export default defineTask({
  meta: {
    name: 'warm-daily-challenge',
    description: 'Precomputes today\'s daily challenge so the first visitor of the day does not pay the cost.',
  },
  async run() {
    const date = new Date().toISOString().slice(0, 10)
    await getDailyChallenge(date, 'es-ES')
    return { result: { date } }
  },
})
