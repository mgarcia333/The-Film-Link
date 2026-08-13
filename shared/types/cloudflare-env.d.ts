// Pulls in the D1Database/Env ambient types wrangler generates at the
// project root (`npx wrangler types`) so server code can reference them
// without an explicit import - see server/utils/kv-cache.ts. Re-run
// `wrangler types` after changing wrangler.jsonc's bindings; this file
// itself never needs touching. A triple-slash reference is the only way
// to pull in an ambient (non-module) global declaration file like this one.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../worker-configuration.d.ts" />
