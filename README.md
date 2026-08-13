# The Film Link

A single-purpose game: get from one film to another by chaining cast and
crew, in as few steps as possible.

You're given a **starting film** and a **target film**. You alternate
between two screens:

1. You're on a film → you see its main cast and director(s) → you pick a
   person.
2. You're on a person → you see their filmography → you pick a film.
3. If that film is the target, you've won.

A worked example:

```
Start:  The King (2019)
  → pick Robert Pattinson (in the cast)
  → pick The Odyssey (2026), where he also appears
  → pick Tom Holland (in the cast)
  → pick Spider-Man: Brand New Day (2026)
Target reached: 2 intermediate films
```

A person already used can't be picked again in the same game. You can undo
your last step, but undoing doesn't lower your step count - it's kept as
part of the path you actually walked. You can give up at any point. Either
way, the game always shows the shortest possible path next to yours.

## Modes

**Daily challenge.** Everyone gets the same pair of films for the day (UTC),
deterministically generated from the date - the same date always produces
the same challenge. It's tuned to a target difficulty of a 2 or 3
intermediate-film optimal path, generated lazily on first request and
cached from then on. Your result and streak are tracked locally.

**Custom challenge.** Search for and pick any two films yourself. Before the
game starts, the server validates that a path exists within the depth limit;
if it doesn't, you're told clearly and asked to try another pair.

## How the path-finding works

The problem is modeled as a bipartite graph: film nodes and person nodes,
with an edge between a person and a film when that person is in its main
cast or directed it.

The engine is a **bidirectional BFS**, expanding from both the starting and
target film at once and always growing whichever frontier is smaller. It
fetches data from TMDB on demand rather than downloading a full graph, and
gives up past a depth of 3 intermediate films.

Two pruning rules keep this workable and keep the game honest:

- A film only ever shows its **top 12 billed cast members plus its
  director(s)** - the same list a player would see on screen. Documentaries,
  and films with no release date, no poster, or too few votes, are excluded
  entirely so the game never routes through something nobody could
  reasonably guess.
- A person's filmography, on the other hand, isn't capped - it shows every
  eligible film they worked on, exactly like the real filmography a player
  would browse.

Those two rules aren't the same relation read backwards: a person can be
reachable from a film they weren't top-billed in, but not the other way
around. The search engine accounts for this asymmetry explicitly, so the
"shortest possible path" it reports is always one a player could actually
click through.

All of this pruning is defined once, as named constants, in
`server/utils/tmdb/pruning.ts`. The bidirectional search itself is a plain,
dependency-free algorithm (`server/utils/path-finding/bidirectional-bfs.ts`)
tested against an in-memory graph, decoupled from TMDB entirely.

Credit lookups, search results, and computed paths are all cached in
Cloudflare KV (credits for 30 days, computed paths effectively
indefinitely), which is what keeps repeat validation fast.

## Stack

- [Nuxt 4](https://nuxt.com) (Vue 3, TypeScript strict mode)
- [Pinia](https://pinia.vuejs.org) + `pinia-plugin-persistedstate` for all
  client state, persisted to `localStorage`
- [Tailwind CSS v4](https://tailwindcss.com), theme tokens as CSS variables
- [TMDB API v3](https://developer.themoviedb.org), called only from Nitro
  server routes
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) with
  static assets, plus [Cloudflare KV](https://developers.cloudflare.com/kv/)
  for caching
- [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) for Google
  sign-in (identity only - name and avatar)
- [@nuxtjs/i18n](https://i18n.nuxtjs.org) in six languages
- [Vitest](https://vitest.dev) for the path-finding engine, ESLint with the
  official Nuxt config

## Getting started

Requires Node.js 20+ and a [TMDB API key](https://www.themoviedb.org/settings/api).

```bash
npm install
cp .env.example .env
# fill in NUXT_TMDB_API_KEY at least - see the table below
npm run dev
```

The dev server also uses Wrangler's local Cloudflare bindings (KV) via
`wrangler.jsonc`, so nothing extra is needed to run the daily challenge or
credit caching locally.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NUXT_TMDB_API_KEY` | yes | TMDB API v3 key. Server-only, never sent to the client. |
| `NUXT_OAUTH_GOOGLE_CLIENT_ID` | for sign-in | Google OAuth client ID. |
| `NUXT_OAUTH_GOOGLE_CLIENT_SECRET` | for sign-in | Google OAuth client secret. |
| `NUXT_SESSION_PASSWORD` | for sign-in | 32+ character secret used to sign the session cookie. |

Google sign-in is entirely optional - the game works identically signed out.
It's used only to show a name and avatar; stats, history, and streaks live
in the browser via Pinia, never on the server.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm run build` | Production build (Nitro, Cloudflare preset). |
| `npm run preview` | Preview the production build locally with Node. |
| `npm run lint` / `lint:fix` | ESLint. |
| `npm run typecheck` | `vue-tsc` project-wide type check. |
| `npm run test` / `test:watch` | Vitest. |
| `npm run deploy` | Build and deploy to Cloudflare Workers. |

## Deploying to Cloudflare

1. Create the KV namespace and copy its id:

   ```bash
   npx wrangler kv namespace create GAME_KV
   ```

   Replace the placeholder `id` under `kv_namespaces` in `wrangler.jsonc`
   with the one you get back.

2. Set the production secrets (these are never read from `.env` in
   production - only `wrangler secret` reaches the deployed Worker):

   ```bash
   npx wrangler secret put NUXT_TMDB_API_KEY
   npx wrangler secret put NUXT_OAUTH_GOOGLE_CLIENT_ID
   npx wrangler secret put NUXT_OAUTH_GOOGLE_CLIENT_SECRET
   npx wrangler secret put NUXT_SESSION_PASSWORD
   ```

3. Deploy:

   ```bash
   npm run deploy
   ```

`wrangler.jsonc` also declares a daily cron trigger that precomputes the
next day's challenge shortly after UTC midnight. It's entirely optional -
the challenge also generates itself lazily on first request - so remove the
`triggers` block if you'd rather not schedule it.

## TMDB attribution

<img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" alt="TMDB logo" width="120">

This product uses the TMDB API but is not endorsed or certified by TMDB.

## License

MIT, see [LICENSE](./LICENSE).
