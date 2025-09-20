# Reddit Seeder Guardrails Report

## Schema discovery
- Target table resolved to `public.moments_seed` via fuzzy discovery and column heuristics.
- Selected constraint: `moments_seed_uniq_idx` on `(source_id, content_title, season, episode, minute)`.
- Column aliases mapped automatically (e.g., `content_title`?`title` when needed).

## Discovery queries executed (REST equivalents)
- `information_schema.tables` ? list of schemas/tables (filters: `table_type = BASE TABLE`, `schema not in (pg_catalog, information_schema)`).
- `information_schema.columns` ? ordered column metadata for `public.moments_seed`.
- `information_schema.table_constraints` + `information_schema.key_column_usage` ? UNIQUE / PK columns.
- `pg_catalog.pg_namespace` + `pg_catalog.pg_class` ? RLS status for public tables.

## Upsert behaviour
- Dry-run logs payload preview plus `ON CONFLICT source_id,content_title,season,episode,minute`.
- Live run performs count-before/after to estimate inserts vs updates.
- Tenacity-style retry implemented manually: backoff doubles from 1s up to 30s on HTTP 429/5xx, logging each retry.

## Acceptance tests (pytest)
```
$ python -m pytest scripts/__tests__/test_wigg_reddit_seed.py
============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-8.4.2, pluggy-1.6.0
rootdir: C:\Users\gatli\Projects\wigg
plugins: anyio-4.10.0
collected 7 items

scripts\__tests__\test_wigg_reddit_seed.py .......                       [100%]

============================== 7 passed in 0.51s ==============================
```
- **Discovery**: verifies table + unique index selection and synonym mapping.
- **Upsert idempotency**: first insert ? `inserted=1`; second pass ? `updated=1`, row count stable.
- **RLS enforcement**: raises when attempting non-dry-run with anon key while RLS enabled.
- **Schema variance**: alias columns (`title`, `ep`) mapped correctly before upsert.
- **Backpressure**: simulates two sequential 429s ? three attempts, backoff logged.

## Observability summary
- Logs include: table/index selection, chosen `on_conflict`, inserted/updated counts, retry notices.
- Dry-run prints first three payloads + conflict key.
- Count queries downgrade gracefully if REST count unsupported.

