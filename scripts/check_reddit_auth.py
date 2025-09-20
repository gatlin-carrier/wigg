import os, praw
cid  = os.getenv("REDDIT_CLIENT_ID")
csec = os.getenv("REDDIT_CLIENT_SECRET")
ua   = os.getenv("REDDIT_USER_AGENT", "wigg-reddit-seeder/1.0")
assert cid and csec, "Missing Reddit creds"

r = praw.Reddit(client_id=cid, client_secret=csec, user_agent=ua)
print("read_only:", r.read_only)
for s in r.subreddit("television").search('"when does" AND "get good"', limit=1, sort="new"):
    print("Sample fetch OK:", s.title)
    break
print("Reddit API looks good.")
