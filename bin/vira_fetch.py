#!/usr/bin/env python3
"""Fetch an X user's recent posts via X API v2 using the stored custom.x-api connector.

This is the "Muse runs it" path: the bearer token lives in the Secure Vault and
is injected as a surrogate at request time, so it never appears in chat, logs,
or files. Mirrors src/x-client.js (same params, same normalized post shape).

Usage:
  vira_fetch.py --handle levelsio [--days 120] [--limit 200] [--out posts.json]

Output JSON: {"user": {...}, "posts": [...]} ready for cli/analyze-file.mjs.
Requires the X dev app on Basic tier ($200/mo) or higher; the user-timeline
endpoint is not available on the Free tier.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.parse
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone

sys.path.insert(0, "/opt/hatch/skills/skill-creator/bin")
from dynamic_credentials import (  # noqa: E402
    add_surrogate_to_request,
    read_json_response,
)

CREDENTIAL = "custom.x-api"
API_BASE = "https://api.x.com/2"
ALLOWED = ["api.x.com"]
PAGE_SIZE = 100

TWEET_FIELDS = (
    "created_at,public_metrics,entities,referenced_tweets,"
    "conversation_id,lang,note_tweet,attachments"
)


def api_get(path, params, attempt=0):
    query = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
    url = API_BASE + path + ("?" + query if query else "")
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    add_surrogate_to_request(req, CREDENTIAL, allowed_hosts=ALLOWED)
    try:
        resp = urllib.request.urlopen(req, timeout=60)
    except urllib.error.HTTPError as exc:
        if exc.code == 429 and attempt < 3:
            wait = 5
            reset = exc.headers.get("x-rate-limit-reset")
            if reset:
                try:
                    wait = max(1, int(reset) - int(time.time()) + 1)
                except ValueError:
                    pass
            time.sleep(min(wait, 900))
            return api_get(path, params, attempt + 1)
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise SystemExit(
            f"X API HTTP {exc.code} on {path}: {detail}\n"
            "(401/403 usually means the bearer token is wrong or the app "
            "is not on Basic tier or higher.)"
        )
    return read_json_response(resp)


def resolve_user(handle):
    h = handle.lstrip("@")
    data = api_get(
        "/users/by",
        {"usernames": h, "user.fields": "created_at,description,public_metrics"},
    )
    users = data.get("data") or []
    if not users:
        raise SystemExit(f"X user not found: @{h}")
    u = users[0]
    pm = u.get("public_metrics") or {}
    return {
        "id": u["id"],
        "username": u.get("username"),
        "name": u.get("name"),
        "description": u.get("description") or "",
        "followers": pm.get("followers_count"),
        "following": pm.get("following_count"),
        "tweetCount": pm.get("tweet_count"),
        "createdAt": u.get("created_at"),
    }


def normalize(tweet, users_by_id):
    pm = tweet.get("public_metrics") or {}
    refs = [r.get("type") for r in tweet.get("referenced_tweets") or []]
    note = tweet.get("note_tweet") or {}
    text = note.get("text") or tweet.get("text") or ""
    entities = tweet.get("entities") or {}
    urls = entities.get("urls") or []
    attachments = tweet.get("attachments") or {}
    reply_to = tweet.get("in_reply_to_user_id")
    return {
        "id": tweet.get("id"),
        "url": f"https://x.com/i/status/{tweet.get('id')}",
        "text": text,
        "createdAt": tweet.get("created_at"),
        "likes": pm.get("like_count") or 0,
        "reposts": pm.get("retweet_count") or 0,
        "replies": pm.get("reply_count") or 0,
        "quotes": pm.get("quote_count") or 0,
        "views": pm.get("impression_count"),
        "lang": tweet.get("lang"),
        "conversationId": tweet.get("conversation_id"),
        "isReply": "replied_to" in refs,
        "isQuote": "quoted" in refs,
        "isOriginal": len(refs) == 0,
        "inReplyToUserId": reply_to,
        "inReplyToUsername": (users_by_id.get(reply_to) or {}).get("username"),
        "hashtags": [h.get("tag") for h in entities.get("hashtags") or []],
        "mentions": [m.get("username") for m in entities.get("mentions") or []],
        "hasMedia": bool(
            (attachments.get("media_keys") or [])
            or any(u.get("media_key") for u in urls)
        ),
        "hasLink": len(urls) > 0,
    }


def fetch_posts(handle, days, limit, include_replies):
    user = resolve_user(handle)
    since = datetime.now(timezone.utc) - timedelta(days=days)
    params = {
        "max_results": PAGE_SIZE,
        "tweet.fields": TWEET_FIELDS,
        "expansions": "in_reply_to_user_id",
        "user.fields": "username",
        "exclude": "retweets",
        "start_time": since.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    posts = []
    users_by_id = {}
    next_token = None
    max_pages = (limit // PAGE_SIZE) + 2
    for _ in range(max_pages):
        if next_token:
            params["pagination_token"] = next_token
        data = api_get(f"/users/{user['id']}/tweets", params)
        for u in ((data.get("includes") or {}).get("users") or []):
            users_by_id[u["id"]] = {"username": u.get("username")}
        for t in data.get("data") or []:
            p = normalize(t, users_by_id)
            if not include_replies and p["isReply"]:
                continue
            posts.append(p)
            if len(posts) >= limit:
                break
        meta = data.get("meta") or {}
        next_token = meta.get("next_token")
        if len(posts) >= limit or not next_token:
            break
    return {"user": user, "posts": posts[:limit]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--handle", required=True)
    ap.add_argument("--days", type=int, default=120)
    ap.add_argument("--limit", type=int, default=200)
    ap.add_argument("--include-replies", action="store_true", default=True)
    ap.add_argument("--no-replies", dest="include_replies", action="store_false")
    ap.add_argument("--out", default="")
    args = ap.parse_args()

    corpus = fetch_posts(args.handle, args.days, args.limit, args.include_replies)
    out = json.dumps(corpus, indent=2, ensure_ascii=False)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(out)
        print(f"Wrote {len(corpus['posts'])} posts for @{corpus['user']['username']} to {args.out}")
    else:
        print(out)


if __name__ == "__main__":
    main()
