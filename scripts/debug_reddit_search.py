#!/usr/bin/env python3
"""
Debug script to isolate Reddit search rate limiting issues.
Tests each search query individually to identify problematic patterns.
"""
import os
import time
import logging
from pathlib import Path
from dotenv import load_dotenv
import praw

# Load environment
for candidate in [
    Path(__file__).with_name('.env'),
    Path.cwd() / '.env',
    Path(__file__).resolve().parent.parent / '.env',
]:
    if candidate.exists():
        load_dotenv(candidate, override=False)
        break

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("reddit_debug")

def make_reddit():
    cid = os.environ.get("REDDIT_CLIENT_ID")
    csec = os.environ.get("REDDIT_CLIENT_SECRET")
    ua = os.environ.get("REDDIT_USER_AGENT", "wigg-reddit-seeder/1.0 by u/_wigg_bot")
    if not (cid and csec):
        raise SystemExit("Missing Reddit API credentials.")
    return praw.Reddit(client_id=cid, client_secret=csec, user_agent=ua)

def test_search_queries():
    reddit = make_reddit()

    # Original queries
    original_queries = [
        'title:"when does" AND title:"get good"',
        '"when does it get good"',
        '"does it get good"',
        '"what episode does" AND "get good"',
        '"picks up" AND (episode OR season)'
    ]

    # "Grow the beard" queries that might be causing issues
    gtb_queries = [
        '"growing the beard"',
        '"grow the beard"'
    ]

    subreddit = reddit.subreddit("television")

    logger.info("Testing original queries...")
    for query in original_queries:
        try:
            logger.info(f"Testing query: {query}")
            results = list(subreddit.search(query, sort="new", limit=3, time_filter="all"))
            logger.info(f"✅ Query '{query}' returned {len(results)} results")
            time.sleep(2)  # Conservative delay
        except Exception as e:
            logger.error(f"❌ Query '{query}' failed: {e}")
            time.sleep(5)  # Longer delay after failure

    logger.info("Testing 'grow the beard' queries...")
    for query in gtb_queries:
        try:
            logger.info(f"Testing GTB query: {query}")
            results = list(subreddit.search(query, sort="new", limit=3, time_filter="all"))
            logger.info(f"✅ GTB query '{query}' returned {len(results)} results")
            time.sleep(2)  # Conservative delay
        except Exception as e:
            logger.error(f"❌ GTB query '{query}' failed: {e}")
            time.sleep(5)  # Longer delay after failure

if __name__ == "__main__":
    test_search_queries()