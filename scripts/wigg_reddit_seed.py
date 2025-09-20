#!/usr/bin/env python3
"""
wigg_reddit_seed.py

Crawl Reddit for posts/comments about "when does [show] get good" and seed
Wigg's database with candidate hook moments (season/episode/minute), tagged
as source=reddit and status=needs_review.

Guardrails implemented:
- Discovers Supabase schema/constraints before writes (no hard-coded names).
- Uses idempotent upserts with the discovered UNIQUE constraint.
- Supports --dry-run to preview payloads without mutating the database.
- Enforces RLS requirements (service role key required when enabled).
- Retries on 429/5xx with exponential backoff.

Requirements:
  pip install praw supabase==2.* python-dateutil tenacity rapidfuzz python-dotenv

Environment variables required:
  REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT
  SUPABASE_URL, SUPABASE_SERVICE_KEY  (use service key for server-side inserts)

Example usage:
  python wigg_reddit_seed.py --subs r/television r/anime --limit 200 --since 2023-01-01 --dry-run
"""
from __future__ import annotations

import argparse
import base64
import json
import logging
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

from dateutil import parser as dtparser
from dotenv import load_dotenv
from rapidfuzz import fuzz, process as rf_process
from tenacity import retry, stop_after_attempt, wait_exponential_jitter

import praw
from supabase import Client, create_client

# ----------------------------- Logging ---------------------------------
logger = logging.getLogger("wigg.reddit_seed")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# ----------------------------- Config ---------------------------------
# Load environment variables from a local .env file if present.
# We search in: script directory, current working directory, and project root (one level up).
for candidate in [
    Path(__file__).with_name('.env'),
    Path.cwd() / '.env',
    Path(__file__).resolve().parent.parent / '.env',
]:
    if candidate.exists():
        load_dotenv(candidate, override=False)
        break

DEFAULT_SUBS = [
    "r/television", "r/anime", "r/movies", "r/netflix",
    "r/Hulu", "r/PeacockTV", "r/DisneyPlus", "r/MaxStreaming",
    "r/AmazonPrimeVideo", "r/cordcutters",
]

SEARCH_QUERIES = [
    'title:"when does" AND title:"get good"',
    '"when does it get good"',
    '"does it get good"',
    '"what episode does" AND "get good"',
    '"picks up" AND (episode OR season)'
]

HOOK_PHRASES = [
    "gets good", "get good", "picks up", "clicks", "worth it after",
    "starts being good", "really starts", "turns around", "hooks you",
    "it hooked me at", "kept watching after"
]

RE_S_E = [
    re.compile(r"\bS(\d{1,2})E(\d{1,3})\b", re.I),
    re.compile(r"\bSeason\s*(\d{1,2})\s*Episode\s*(\d{1,3})\b", re.I),
    re.compile(r"\b(\d{1,2})x(\d{1,3})\b"),
    re.compile(r"\bEp(?:isode)?\s*(\d{1,3})\b", re.I),
]
RE_MIN = [
    re.compile(r"\b(\d{1,3})\s*min(?:ute)?s?\b", re.I),
    re.compile(r"\bat\s*(\d{1,3})\s*min\b", re.I),
]

CANONICAL_FIELD_SYNONYMS: Dict[str, List[str]] = {
    "content_title": ["title", "show_title", "name", "series_title"],
    "season": ["season", "season_number", "season_num"],
    "episode": ["episode", "ep", "episode_number", "episode_num"],
    "minute": ["minute", "minute_mark", "minute_offset", "minute_at"],
    "source_url": ["source_url", "url", "permalink"],
    "source_type": ["source_type", "type"],
    "source_subreddit": ["source_subreddit", "subreddit"],
    "source_kind": ["source_kind", "kind"],
    "source_id": ["source_id", "external_id", "reddit_id"],
    "score": ["score", "upvotes"],
    "confidence": ["confidence", "confidence_score"],
    "quote": ["quote", "excerpt", "snippet"],
    "created_utc": ["created_utc", "created_at", "timestamp_utc"],
    "status": ["status", "state"],
}

PREFERRED_UNIQUES: List[List[str]] = [
    ["source_id", "content_title", "season", "episode", "minute"],
    ["source_id", "content_title", "episode"],
    ["source_id", "content_title"],
]

RETRYABLE_STATUS = {429, 500, 502, 503, 504}

# --------------------------- Data classes ------------------------------
@dataclass(frozen=True)
class ColumnInfo:
    name: str
    data_type: Optional[str] = None
    is_nullable: Optional[bool] = None
    default: Optional[str] = None


@dataclass(frozen=True)
class DiscoveryResult:
    table_schema: str
    table_name: str
    columns: Dict[str, ColumnInfo]
    column_mapping: Dict[str, Optional[str]]
    unique_constraint_name: Optional[str]
    on_conflict_columns: List[str]
    rls_enabled: bool
    raw_constraints: Dict[str, Dict[str, Sequence[str]]]

    @property
    def full_table_name(self) -> str:
        return f"{self.table_schema}.{self.table_name}"

    @property
    def supports_upsert(self) -> bool:
        return bool(self.on_conflict_columns)


@dataclass(frozen=True)
class UpsertResult:
    inserted: int
    updated: int


@dataclass
class CandidateMoment:
    content_title: str
    season: Optional[int]
    episode: Optional[int]
    minute: Optional[int]
    source_url: str
    source_type: str
    source_subreddit: str
    source_kind: str
    source_id: str
    score: int
    confidence: float
    quote: str
    created_utc: int
    status: str = "needs_review"

    def to_payload(self, column_mapping: Dict[str, Optional[str]]) -> Dict[str, object]:
        payload: Dict[str, object] = {}
        for canonical, column in column_mapping.items():
            if not column:
                continue
            value = getattr(self, canonical, None)
            if canonical == "minute" and value is not None:
                value = clamp_minute(int(value))
            payload[column] = value
        return payload


# ------------------------ Supabase discovery ---------------------------
class SupabaseMetaFetcher:
    def __init__(self, url: str, service_key: str, *, timeout: int = 15, logger: Optional[logging.Logger] = None):
        self.base_url = url.rstrip('/')
        self.service_key = service_key
        self.timeout = timeout
        self.logger = logger or logging.getLogger("wigg.reddit_seed.fetcher")

    def _headers(self, profile: Optional[str]) -> Dict[str, str]:
        headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Accept": "application/json",
        }
        if profile:
            headers["Accept-Profile"] = profile
        return headers

    @staticmethod
    def _encode_params(params: Dict[str, str]) -> str:
        encoded_parts = []
        for key, value in params.items():
            if value is None:
                continue
            encoded = urllib.parse.quote(str(value), safe='*(),.:')
            encoded_parts.append(f"{key}={encoded}")
        return "&".join(encoded_parts)

    def _get(self, path: str, params: Dict[str, str], profile: Optional[str]) -> List[Dict[str, object]]:
        query = self._encode_params(params)
        url = f"{self.base_url}/rest/v1/{path}"
        if query:
            url = f"{url}?{query}"
        req = urllib.request.Request(url, headers=self._headers(profile), method="GET")
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:  # type: ignore[arg-type]
            data = resp.read()
            if not data:
                return []
            return json.loads(data.decode("utf-8"))

    def list_tables(self) -> List[Dict[str, object]]:
        return self._get(
            "tables",
            {
                "select": "table_schema,table_name",
                "table_type": "eq.BASE TABLE",
                "table_schema": "not.in.(pg_catalog,information_schema)",
                "order": "table_schema,table_name",
            },
            profile="information_schema",
        )

    def list_columns(self, table: str) -> List[Dict[str, object]]:
        return self._get(
            "columns",
            {
                "select": "column_name,data_type,is_nullable,column_default,ordinal_position",
                "table_schema": "eq.public",
                "table_name": f"eq.{table}",
                "order": "ordinal_position",
            },
            profile="information_schema",
        )

    def list_constraint_columns(self, table: str) -> List[Dict[str, object]]:
        constraints = self._get(
            "table_constraints",
            {
                "select": "constraint_name,table_name,constraint_type",
                "table_schema": "eq.public",
                "table_name": f"eq.{table}",
                "constraint_type": "in.(PRIMARY KEY,UNIQUE)",
            },
            profile="information_schema",
        )
        key_usage = self._get(
            "key_column_usage",
            {
                "select": "constraint_name,column_name,ordinal_position",
                "table_schema": "eq.public",
                "table_name": f"eq.{table}",
                "order": "ordinal_position",
            },
            profile="information_schema",
        )
        by_constraint: Dict[str, List[Tuple[int, str]]] = {}
        for row in key_usage:
            by_constraint.setdefault(str(row["constraint_name"]), []).append((int(row.get("ordinal_position", 0) or 0), str(row["column_name"])))
        result: List[Dict[str, object]] = []
        for c in constraints:
            name = str(c["constraint_name"])
            cols = sorted(by_constraint.get(name, []), key=lambda pair: pair[0])
            for _, column_name in cols:
                result.append(
                    {
                        "constraint_name": name,
                        "constraint_type": str(c["constraint_type"]),
                        "column_name": column_name,
                    }
                )
        return result

    def list_rls(self) -> Dict[str, bool]:
        public_oid_rows = self._get(
            "pg_namespace",
            {
                "select": "oid",
                "nspname": "eq.public",
                "limit": "1",
            },
            profile="pg_catalog",
        )
        if not public_oid_rows:
            return {}
        public_oid = public_oid_rows[0].get("oid")
        rows = self._get(
            "pg_class",
            {
                "select": "relname,relrowsecurity",
                "relkind": "eq.r",
                "relnamespace": f"eq.{public_oid}",
            },
            profile="pg_catalog",
        )
        return {str(r["relname"]): bool(r["relrowsecurity"]) for r in rows}


class DatabaseDiscovery:
    def __init__(self, fetcher: SupabaseMetaFetcher, *, allow_migrations: bool = False, logger: Optional[logging.Logger] = None):
        self.fetcher = fetcher
        self.allow_migrations = allow_migrations
        self.logger = logger or logging.getLogger("wigg.reddit_seed.discovery")
        self._tables: Optional[List[Dict[str, object]]] = None
        self._rls_map: Optional[Dict[str, bool]] = None

    def discover(self, desired_table: str) -> DiscoveryResult:
        tables = self._get_tables()
        table_record = self._select_table(desired_table, tables)
        if not table_record:
            raise RuntimeError(f"Table matching '{desired_table}' not found; migrations required or check configuration.")

        table_name = str(table_record["table_name"])
        table_schema = str(table_record.get("table_schema", "public"))
        columns_data = self.fetcher.list_columns(table_name)
        columns: Dict[str, ColumnInfo] = {
            str(col["column_name"]): ColumnInfo(
                name=str(col["column_name"]),
                data_type=str(col.get("data_type") or ""),
                is_nullable=(str(col.get("is_nullable", "YES")).upper() == "YES"),
                default=str(col.get("column_default")) if col.get("column_default") is not None else None,
            )
            for col in columns_data
        }
        column_names = list(columns.keys())
        column_mapping = self._build_column_mapping(column_names)

        constraints_rows = self.fetcher.list_constraint_columns(table_name)
        constraints: Dict[str, Dict[str, Sequence[str]]] = {}
        for row in constraints_rows:
            name = str(row["constraint_name"])
            constraint = constraints.setdefault(name, {"type": str(row["constraint_type"]), "columns": []})
            cols: List[str] = list(constraint["columns"])
            cols.append(str(row["column_name"]))
            constraint["columns"] = cols

        unique_name, on_conflict = self._select_unique(constraints, column_mapping)

        rls_map = self._get_rls_map()
        rls_enabled = bool(rls_map.get(table_name, False))

        self.logger.info(
            "[Discovery] table=%s unique=%s on_conflict=%s rls=%s",
            f"{table_schema}.{table_name}",
            unique_name or "<none>",
            ",".join(on_conflict) if on_conflict else "<none>",
            rls_enabled,
        )

        return DiscoveryResult(
            table_schema=table_schema,
            table_name=table_name,
            columns=columns,
            column_mapping=column_mapping,
            unique_constraint_name=unique_name,
            on_conflict_columns=on_conflict,
            rls_enabled=rls_enabled,
            raw_constraints=constraints,
        )

    def _get_tables(self) -> List[Dict[str, object]]:
        if self._tables is None:
            self._tables = self.fetcher.list_tables()
        return self._tables

    def _get_rls_map(self) -> Dict[str, bool]:
        if self._rls_map is None:
            self._rls_map = self.fetcher.list_rls()
        return self._rls_map

    def _select_table(self, desired_table: str, tables: List[Dict[str, object]]) -> Optional[Dict[str, object]]:
        desired_lower = desired_table.lower()
        for record in tables:
            if str(record["table_name"]).lower() == desired_lower:
                return record
        candidates = [t for t in tables if str(t.get("table_schema", "public")) == "public"]
        names = [str(t["table_name"]) for t in candidates]
        matches = rf_process.extract(desired_table, names, scorer=fuzz.WRatio, limit=3)
        if matches:
            best_name, score, index = matches[0]
            if score >= 70:
                self.logger.info("[Discovery] fuzzy matched %s -> %s (score=%s)", desired_table, best_name, score)
                return candidates[index]
        hook_matches = [t for t in candidates if re.search(r"moment|hook|seed", str(t["table_name"]), re.I)]
        if hook_matches:
            self.logger.info("[Discovery] fallback to semantic candidate %s", hook_matches[0]["table_name"])
            return hook_matches[0]
        return None

    def _build_column_mapping(self, columns: List[str]) -> Dict[str, Optional[str]]:
        mapping: Dict[str, Optional[str]] = {}
        available = {col.lower(): col for col in columns}
        used: set[str] = set()
        for canonical, synonyms in CANONICAL_FIELD_SYNONYMS.items():
            match: Optional[str] = None
            search_order = [canonical] + [syn for syn in synonyms if syn.lower() != canonical.lower()]
            for candidate in search_order:
                existing = available.get(candidate.lower())
                if existing and existing not in used:
                    match = existing
                    break
            if not match and columns:
                best = rf_process.extractOne(canonical.replace("_", " "), [c for c in columns if c not in used], scorer=fuzz.WRatio)
                if best and best[1] >= 78:
                    match = best[0]
            if match:
                used.add(match)
            mapping[canonical] = match
        return mapping

    def _select_unique(self, constraints: Dict[str, Dict[str, Sequence[str]]], mapping: Dict[str, Optional[str]]) -> Tuple[Optional[str], List[str]]:
        available_columns = {v for v in mapping.values() if v}
        for canonical_set in PREFERRED_UNIQUES:
            actual = [mapping.get(name) for name in canonical_set]
            if not all(actual):
                continue
            actual_list = [str(col) for col in actual if col]
            for name, meta in constraints.items():
                if meta["type"].upper() != "UNIQUE":
                    continue
                if list(meta["columns"]) == actual_list:
                    return name, actual_list
        for name, meta in constraints.items():
            if meta["type"].upper() != "UNIQUE":
                continue
            cols = list(meta["columns"])
            if all(col in available_columns for col in cols):
                return name, cols
        return None, []


def decode_supabase_role(key: Optional[str]) -> str:
    if not key:
        return "unknown"
    try:
        parts = key.split('.')
        if len(parts) < 2:
            return "unknown"
        payload_b64 = parts[1]
        padding = '=' * (-len(payload_b64) % 4)
        payload = base64.urlsafe_b64decode(payload_b64 + padding)
        data = json.loads(payload.decode('utf-8'))
        return str(data.get('role', 'unknown'))
    except Exception:
        return "unknown"


class SupabaseWriter:
    def __init__(
        self,
        *,
        client: Client,
        discovery: DiscoveryResult,
        dry_run: bool,
        logger: Optional[logging.Logger] = None,
        service_key_role: str,
        max_attempts: int = 5,
        base_backoff: float = 1.0,
    ) -> None:
        self.client = client
        self.discovery = discovery
        self.dry_run = dry_run
        self.logger = logger or logging.getLogger("wigg.reddit_seed.writer")
        self.service_key_role = service_key_role
        self.max_attempts = max_attempts
        self.base_backoff = base_backoff

    def _ensure_service_role_when_needed(self) -> None:
        if self.discovery.rls_enabled and self.service_key_role != "service_role":
            raise RuntimeError(
                "Row Level Security is enabled for the target table; a service role key is required for writes."
            )

    def upsert_candidates(self, candidates: Sequence[CandidateMoment]) -> UpsertResult:
        payloads: List[Dict[str, object]] = []
        for candidate in candidates:
            payload = candidate.to_payload(self.discovery.column_mapping)
            if not payload:
                self.logger.warning("Skipping candidate %s due to empty payload after column mapping", candidate.source_id)
                continue
            payloads.append(payload)

        if not payloads:
            return UpsertResult(inserted=0, updated=0)

        if self.dry_run:
            self.logger.info(
                "DRY-RUN: would upsert %d rows into %s (on_conflict=%s)",
                len(payloads),
                self.discovery.full_table_name,
                ",".join(self.discovery.on_conflict_columns) or "<none>",
            )
            sample = payloads[:3]
            self.logger.info("Dry-run sample payloads: %s", json.dumps(sample, default=str))
            return UpsertResult(inserted=0, updated=0)

        self._ensure_service_role_when_needed()

        if not self.discovery.supports_upsert:
            raise RuntimeError("No suitable UNIQUE constraint discovered; aborting to avoid duplicate inserts.")

        count_before = self._count_rows()
        response = self._execute_with_retry(payloads)
        count_after = self._count_rows()

        inserted = getattr(response, "inserted", None)
        updated = getattr(response, "updated", None)
        if inserted is None:
            inserted = max(count_after - count_before, 0)
        if updated is None:
            updated = max(len(payloads) - inserted, 0)

        self.logger.info(
            "Upsert complete: inserted=%d updated=%d table=%s on_conflict=%s",
            inserted,
            updated,
            self.discovery.full_table_name,
            ",".join(self.discovery.on_conflict_columns),
        )
        return UpsertResult(inserted=inserted, updated=updated)

    def _count_rows(self) -> int:
        try:
            response = self.client.table(self.discovery.table_name).select('*', count='exact').execute()
            if hasattr(response, 'count') and response.count is not None:
                return int(response.count)
            return len(getattr(response, 'data', []) or [])
        except Exception as exc:
            self.logger.warning("Unable to fetch row count: %s", exc)
            return 0

    def _execute_with_retry(self, payloads: List[Dict[str, object]]):
        attempt = 0
        delay = self.base_backoff
        while True:
            attempt += 1
            try:
                return (
                    self.client
                    .table(self.discovery.table_name)
                    .upsert(
                        payloads,
                        on_conflict=",".join(self.discovery.on_conflict_columns),
                    )
                    .execute()
                )
            except Exception as exc:
                status = getattr(exc, 'status_code', None)
                if status is None:
                    status = self._parse_status_from_message(exc)
                if status in RETRYABLE_STATUS and attempt < self.max_attempts:
                    self.logger.warning(
                        "Supabase returned %s, retrying with backoff %.1fs (attempt %d/%d)",
                        status,
                        delay,
                        attempt,
                        self.max_attempts,
                    )
                    time.sleep(delay)
                    delay = min(delay * 2, 30.0)
                    continue
                self.logger.error("Supabase upsert failed after %d attempts: %s", attempt, exc)
                raise

    @staticmethod
    def _parse_status_from_message(exc: Exception) -> Optional[int]:
        message = str(exc)
        match = re.search(r"\b(429|5\d{2})\b", message)
        if match:
            return int(match.group(1))
        return None


# ----------------------------- Helpers --------------------------------

def normalize_show_title(title: str) -> str:
    """Attempt to isolate the show name from a typical query title."""
    t = title
    t = re.sub(r"\[.*?\]", "", t)
    t = re.sub(r"\(.*?\)", "", t)
    t = t.replace("?", " ")
    t = re.sub(r"(?i)when does|does|get good|when will|when did|it get good|does it|worth it|pick up|picks up", " ", t)
    t = re.sub(r"\s+", " ", t).strip(" -:.")
    return " ".join([w if w.isupper() else w.capitalize() for w in t.split()])


def extract_moments(text: str) -> List[Tuple[Optional[int], Optional[int], Optional[int], float, str]]:
    results: List[Tuple[Optional[int], Optional[int], Optional[int], float, str]] = []
    lowered = text.lower()
    has_hook_phrase = any(p in lowered for p in HOOK_PHRASES)

    ses: List[Tuple[Optional[int], Optional[int]]] = []
    for rx in RE_S_E:
        for m in rx.finditer(text):
            if 'Ep' in rx.pattern or 'ep' in rx.pattern:
                ep = int(m.group(1))
                ses.append((None, ep))
            elif 'Season' in rx.pattern or 'season' in rx.pattern:
                ses.append((int(m.group(1)), int(m.group(2))))
            elif 'x' in rx.pattern:
                ses.append((int(m.group(1)), int(m.group(2))))
            else:
                ses.append((int(m.group(1)), int(m.group(2))))

    mins: List[int] = []
    for rx in RE_MIN:
        for m in rx.finditer(text):
            try:
                mins.append(int(m.group(1)))
            except Exception:
                continue

    if not ses and not mins:
        return []

    base_conf = 0.5 if has_hook_phrase else 0.3

    def pick_minute() -> Optional[int]:
        if not mins:
            return None
        return clamp_minute(int(sum(mins) / len(mins)))

    for (s, e) in ses or [(None, None)]:
        minute = pick_minute()
        quote = snippet(text)
        conf = min(0.95, base_conf + (0.1 if minute is not None else 0))
        results.append((s, e, minute, conf, quote))
    return results


def clamp_minute(m: int) -> int:
    return max(0, min(m, 180))


def snippet(text: str, length: int = 240) -> str:
    t = re.sub(r"\s+", " ", text).strip()
    return (t[: length - 1] + "?") if len(t) > length else t


# ----------------------------- Reddit client ---------------------------

def make_reddit() -> praw.Reddit:
    cid = os.environ.get("REDDIT_CLIENT_ID")
    csec = os.environ.get("REDDIT_CLIENT_SECRET")
    ua = os.environ.get("REDDIT_USER_AGENT", "wigg-reddit-seeder/1.0 by u/_wigg_bot")
    if not (cid and csec):
        raise SystemExit("Missing Reddit API credentials.")
    return praw.Reddit(client_id=cid, client_secret=csec, user_agent=ua)


# ----------------------------- Supabase client -------------------------

def make_supabase() -> Tuple[Client, SupabaseMetaFetcher, DiscoveryResult, SupabaseWriter]:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        missing = []
        if not url:
            missing.append("SUPABASE_URL")
        if not key:
            missing.append("SUPABASE_SERVICE_KEY")
        raise SystemExit(f"Missing Supabase env vars: {', '.join(missing)}")

    service_role = decode_supabase_role(key)
    if service_role != "service_role":
        logger.warning("Service key role is %s; service_role recommended for server writes.", service_role)

    meta_fetcher = SupabaseMetaFetcher(url, key, logger=logger)
    discovery = DatabaseDiscovery(meta_fetcher, logger=logger).discover(os.environ.get("MOMENT_TABLE", "moments_seed"))
    supabase_client = create_client(url, key)
    writer = SupabaseWriter(
        client=supabase_client,
        discovery=discovery,
        dry_run=False,
        logger=logger,
        service_key_role=service_role,
    )
    return supabase_client, meta_fetcher, discovery, writer


# ----------------------------- Core crawl ------------------------------
@retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(1, 5))
def index_submission(subm, writer: SupabaseWriter) -> UpsertResult:
    title = subm.title or ""
    selftext = subm.selftext or ""
    content_title = normalize_show_title(title)

    inserted = 0
    updated = 0

    for (s, e, minute, conf, quote) in extract_moments(f"{title}\n{selftext}"):
        result = insert_moment(writer, content_title, s, e, minute, conf, subm, quote)
        inserted += result.inserted
        updated += result.updated

    subm.comments.replace_more(limit=0)
    for c in subm.comments.list()[:200]:
        for (s, e, minute, conf, quote) in extract_moments(getattr(c, 'body', '') or ''):
            conf2 = min(0.95, conf + min(max(getattr(c, 'score', 0), 0), 50) / 400.0)
            result = insert_moment(writer, content_title, s, e, minute, conf2, c, quote)
            inserted += result.inserted
            updated += result.updated

    return UpsertResult(inserted=inserted, updated=updated)


def insert_moment(
    writer: SupabaseWriter,
    content_title: str,
    season: Optional[int],
    episode: Optional[int],
    minute: Optional[int],
    confidence: float,
    src,
    quote: str,
) -> UpsertResult:
    candidate = CandidateMoment(
        content_title=content_title,
        season=season,
        episode=episode,
        minute=minute,
        source_url=f"https://www.reddit.com{getattr(src, 'permalink', '')}",
        source_type="reddit",
        source_subreddit=str(getattr(src, 'subreddit', '')),
        source_kind=src.__class__.__name__.lower(),
        source_id=str(getattr(src, 'id', '')),
        score=int(getattr(src, 'score', 0)),
        confidence=round(confidence, 3),
        quote=quote,
        created_utc=int(getattr(src, 'created_utc', time.time())),
        status="needs_review",
    )
    return writer.upsert_candidates([candidate])


# ----------------------------- Runner ---------------------------------
def run(args: argparse.Namespace) -> None:
    reddit = make_reddit()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise SystemExit("SUPABASE_URL and SUPABASE_SERVICE_KEY are required")

    service_role = decode_supabase_role(key)
    meta_fetcher = SupabaseMetaFetcher(url, key, logger=logger)
    discovery = DatabaseDiscovery(meta_fetcher, logger=logger).discover(args.moment_table)

    supabase_client = create_client(url, key)
    writer = SupabaseWriter(
        client=supabase_client,
        discovery=discovery,
        dry_run=args.dry_run,
        logger=logger,
        service_key_role=service_role,
    )

    since_ts = 0
    if args.since:
        since_ts = int(dtparser.parse(args.since).replace(tzinfo=timezone.utc).timestamp())

    total_inserted = 0
    total_updated = 0
    total_processed = 0

    for sub in args.subs:
        sr = reddit.subreddit(sub.replace("r/", ""))
        for q in SEARCH_QUERIES:
            logger.info("Searching %s for %s", sub, q)
            try:
                for submission in sr.search(q, sort="new", limit=args.limit, time_filter="all"):
                    if since_ts and int(getattr(submission, 'created_utc', 0)) < since_ts:
                        continue
                    result = index_submission(submission, writer)
                    total_inserted += result.inserted
                    total_updated += result.updated
                    total_processed += 1
            except Exception as exc:
                logger.error("Search error in %s for '%s': %s", sub, q, exc)
                continue

    logger.info(
        "Run complete. processed_submissions=%d inserted=%d updated=%d dry_run=%s",
        total_processed,
        total_inserted,
        total_updated,
        args.dry_run,
    )


# ----------------------------- CLI ------------------------------------
if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Seed Wigg DB with Reddit 'when does it get good' signals.")
    ap.add_argument("--subs", nargs="*", default=DEFAULT_SUBS, help="Subreddits to search (e.g., r/television r/anime)")
    ap.add_argument("--limit", type=int, default=200, help="Max results per query per sub")
    ap.add_argument("--since", type=str, default=None, help="Only index posts after this date (e.g., 2023-01-01)")
    ap.add_argument("--moment-table", type=str, default="moments_seed", help="Supabase table for candidate moments")
    ap.add_argument("--dry-run", action="store_true", help="Log payloads without writing to the database")
    args = ap.parse_args()

    try:
        run(args)
    except Exception as exc:
        logger.error("Fatal error: %s", exc)
        sys.exit(1)
