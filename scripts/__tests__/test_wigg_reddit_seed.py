import json
import time
from dataclasses import replace
from typing import Dict, List
from unittest import mock

import pytest

from scripts.wigg_reddit_seed import (
    CandidateMoment,
    DatabaseDiscovery,
    DiscoveryResult,
    SupabaseWriter,
    decode_supabase_role,
)


class StubFetcher:
    def __init__(self, tables, columns, constraints, rls_map):
        self._tables = tables
        self._columns = columns
        self._constraints = constraints
        self._rls_map = rls_map

    def list_tables(self) -> List[Dict]:
        return self._tables

    def list_columns(self, table: str) -> List[Dict]:
        return self._columns[table]

    def list_constraint_columns(self, table: str) -> List[Dict]:
        return self._constraints[table]

    def list_rls(self) -> Dict[str, bool]:
        return self._rls_map


class FakeSupabaseError(Exception):
    def __init__(self, status_code: int, message: str = ""):
        super().__init__(message or f"status {status_code}")
        self.status_code = status_code


class FakeSupabaseClient:
    def __init__(self, on_conflict: List[str]):
        self.storage: Dict[str, Dict] = {}
        self.on_conflict = on_conflict
        self.failures_before_success = 0
        self.upsert_attempts = 0
        self.count_calls = 0

    def table(self, name: str):
        return FakeTable(self, name)

    def row_count(self, table: str) -> int:
        table_bucket = self.storage.get(table, {})
        return len(table_bucket)


class FakeTable:
    def __init__(self, client: FakeSupabaseClient, table: str):
        self.client = client
        self.table = table

    def select(self, *_args, **_kwargs):
        self.client.count_calls += 1
        return FakeSelectOp(self.client, self.table)

    def upsert(self, payloads, on_conflict: str):
        return FakeUpsertOp(self.client, self.table, payloads, on_conflict)


class FakeSelectOp:
    def __init__(self, client: FakeSupabaseClient, table: str):
        self.client = client
        self.table = table

    def limit(self, _value):
        return self

    def execute(self):
        count = self.client.row_count(self.table)
        return FakeResponse([], count)


class FakeUpsertOp:
    def __init__(self, client: FakeSupabaseClient, table: str, payloads, on_conflict: str):
        self.client = client
        self.table = table
        self.payloads = payloads
        self.on_conflict = [c.strip() for c in on_conflict.split(',')]

    def execute(self):
        self.client.upsert_attempts += 1
        if self.client.failures_before_success > 0:
            self.client.failures_before_success -= 1
            raise FakeSupabaseError(429)

        table_bucket = self.client.storage.setdefault(self.table, {})
        inserted = 0
        updated = 0
        for payload in self.payloads:
            key = tuple(payload.get(col) for col in self.on_conflict)
            if key in table_bucket:
                table_bucket[key].update(payload)
                updated += 1
            else:
                table_bucket[key] = dict(payload)
                inserted += 1
        return FakeResponse(self.payloads, len(table_bucket), inserted=inserted, updated=updated)


class FakeResponse:
    def __init__(self, data, count, inserted=0, updated=0):
        self.data = data
        self.count = count
        self.inserted = inserted
        self.updated = updated


class ListLogger:
    def __init__(self):
        self.messages: List[str] = []

    def _record(self, msg: str, args: tuple):
        if args:
            try:
                msg = msg % args
            except Exception:
                msg = " ".join([msg, *[str(a) for a in args]])
        self.messages.append(str(msg))

    def info(self, msg: str, *args):
        self._record(msg, args)

    def warning(self, msg: str, *args):
        self._record(msg, args)

    def error(self, msg: str, *args):
        self._record(msg, args)

    def debug(self, msg: str, *args):
        self._record(msg, args)

    def joined(self) -> str:
        return "\n".join(self.messages)


@pytest.fixture
def canonical_discovery_result():
    tables = [{"table_schema": "public", "table_name": "moments_seed"}]
    columns = {
        "moments_seed": [
            {"column_name": "id"},
            {"column_name": "content_title"},
            {"column_name": "season"},
            {"column_name": "episode"},
            {"column_name": "minute"},
            {"column_name": "source_url"},
            {"column_name": "source_type"},
            {"column_name": "source_subreddit"},
            {"column_name": "source_kind"},
            {"column_name": "source_id"},
            {"column_name": "score"},
            {"column_name": "confidence"},
            {"column_name": "quote"},
            {"column_name": "created_utc"},
            {"column_name": "status"},
        ]
    }
    constraints = {
        "moments_seed": [
            {
                "constraint_name": "moments_seed_pkey",
                "constraint_type": "PRIMARY KEY",
                "column_name": "id",
            },
            {
                "constraint_name": "moments_seed_uniq_idx",
                "constraint_type": "UNIQUE",
                "column_name": "source_id",
            },
            {
                "constraint_name": "moments_seed_uniq_idx",
                "constraint_type": "UNIQUE",
                "column_name": "content_title",
            },
            {
                "constraint_name": "moments_seed_uniq_idx",
                "constraint_type": "UNIQUE",
                "column_name": "season",
            },
            {
                "constraint_name": "moments_seed_uniq_idx",
                "constraint_type": "UNIQUE",
                "column_name": "episode",
            },
            {
                "constraint_name": "moments_seed_uniq_idx",
                "constraint_type": "UNIQUE",
                "column_name": "minute",
            },
        ]
    }
    rls = {"moments_seed": False}
    fetcher = StubFetcher(tables, columns, constraints, rls)
    discovery = DatabaseDiscovery(fetcher)
    return discovery.discover("moments_seed")


def make_candidate(**overrides):
    base = CandidateMoment(
        content_title="Example Show",
        season=1,
        episode=3,
        minute=42,
        source_url="https://reddit.com/x",
        source_type="reddit",
        source_subreddit="r/example",
        source_kind="comment",
        source_id="abc123",
        score=10,
        confidence=0.9,
        quote="It gets good at S1E3",
        created_utc=1700000000,
        status="needs_review",
    )
    return replace(base, **overrides)


def test_discovery_selects_recommended_unique_index(canonical_discovery_result):
    result = canonical_discovery_result
    assert result.table_name == "moments_seed"
    assert result.unique_constraint_name == "moments_seed_uniq_idx"
    assert result.on_conflict_columns == [
        "source_id",
        "content_title",
        "season",
        "episode",
        "minute",
    ]


def test_discovery_maps_synonymous_columns():
    tables = [{"table_schema": "public", "table_name": "moments_seed"}]
    columns = {
        "moments_seed": [
            {"column_name": "title"},
            {"column_name": "season_number"},
            {"column_name": "ep"},
            {"column_name": "minute_mark"},
            {"column_name": "source_id"},
            {"column_name": "confidence"},
            {"column_name": "created_utc"},
        ]
    }
    constraints = {
        "moments_seed": [
            {
                "constraint_name": "moments_seed_alt_unique",
                "constraint_type": "UNIQUE",
                "column_name": "source_id",
            },
            {
                "constraint_name": "moments_seed_alt_unique",
                "constraint_type": "UNIQUE",
                "column_name": "title",
            },
            {
                "constraint_name": "moments_seed_alt_unique",
                "constraint_type": "UNIQUE",
                "column_name": "ep",
            },
        ]
    }
    rls = {"moments_seed": False}
    discovery = DatabaseDiscovery(StubFetcher(tables, columns, constraints, rls))
    result = discovery.discover("moments_seed")
    assert result.column_mapping["content_title"] == "title"
    assert result.column_mapping["episode"] == "ep"
    assert result.on_conflict_columns == ["source_id", "title", "ep"]


def test_supabase_writer_dry_run_skips_upsert(canonical_discovery_result):
    client = FakeSupabaseClient(canonical_discovery_result.on_conflict_columns)
    logger = ListLogger()
    writer = SupabaseWriter(
        client=client,
        discovery=canonical_discovery_result,
        dry_run=True,
        logger=logger,
        service_key_role="service_role",
    )
    result = writer.upsert_candidates([make_candidate()])
    assert result.inserted == 0
    assert result.updated == 0
    assert client.upsert_attempts == 0
    assert "DRY-RUN" in logger.joined()


def test_supabase_writer_upsert_is_idempotent(canonical_discovery_result):
    client = FakeSupabaseClient(canonical_discovery_result.on_conflict_columns)
    logger = ListLogger()
    writer = SupabaseWriter(
        client=client,
        discovery=canonical_discovery_result,
        dry_run=False,
        logger=logger,
        service_key_role="service_role",
    )
    payload = make_candidate()
    first = writer.upsert_candidates([payload])
    second = writer.upsert_candidates([payload])
    assert first.inserted == 1
    assert first.updated == 0
    assert second.inserted == 0
    assert second.updated == 1
    assert client.row_count(canonical_discovery_result.table_name) == 1


def test_supabase_writer_requires_service_role_when_rls_enabled(canonical_discovery_result):
    discovery = replace(canonical_discovery_result, rls_enabled=True)
    client = FakeSupabaseClient(discovery.on_conflict_columns)
    logger = ListLogger()
    writer = SupabaseWriter(
        client=client,
        discovery=discovery,
        dry_run=False,
        logger=logger,
        service_key_role="anon",
    )
    with pytest.raises(RuntimeError):
        writer.upsert_candidates([make_candidate()])


def test_supabase_writer_retries_on_rate_limit(canonical_discovery_result):
    client = FakeSupabaseClient(canonical_discovery_result.on_conflict_columns)
    client.failures_before_success = 2
    logger = ListLogger()
    writer = SupabaseWriter(
        client=client,
        discovery=canonical_discovery_result,
        dry_run=False,
        logger=logger,
        service_key_role="service_role",
    )
    candidate = make_candidate(source_id="rate-limit")

    with mock.patch("time.sleep") as sleep_mock:
        result = writer.upsert_candidates([candidate])

    assert result.inserted == 1
    assert result.updated == 0
    assert client.upsert_attempts == 3
    assert sleep_mock.call_count == 2
    joined = logger.joined()
    assert "429" in joined
    assert "backoff" in joined


def test_decode_supabase_role_handles_service_key():
    service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." \
        "eyJyb2xlIjoic2VydmljZV9yb2xlIn0." \
        "dummy"
    assert decode_supabase_role(service_key) == "service_role"
    anon_key = "header.eyJyb2xlIjoiYW5vbiJ9.sig"
    assert decode_supabase_role(anon_key) == "anon"
