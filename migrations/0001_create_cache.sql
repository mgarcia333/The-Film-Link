-- Generic key-value cache table, replacing Cloudflare KV: same
-- get/set/delete/ttl semantics the app already relied on, but without KV's
-- daily write-count cap. expires_at is a unix timestamp in seconds; NULL
-- means the entry never expires.
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache (expires_at);
