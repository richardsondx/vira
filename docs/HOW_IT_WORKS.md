# How VIRA works

VIRA mirrors the rea-agents loop, retargeted from binaries to creators.

## rea: inspect -> trace -> evidence -> build

- Agent calls REA over MCP to inspect a binary or app
- REA traces relevant code paths
- Returns findings with evidence and limitations
- Agent explains the behavior or builds a version

## vira: collect -> pattern-mine -> evidence -> playbook

1. **Collect**
   - `analyze_creator_profile`: bio, follower count, niche, pinned posts
   - `fetch_top_posts`: top 200 posts over 90-180 days, full text, timestamps, URLs, like/repost/reply counts
   - Data source: X API v2 (preferred), Social Blade or Favikon for follower time series

2. **Pattern-mine** (run in parallel)
   - `detect_posting_pattern`: posts per day histogram, thread vs single ratio, media usage, reply/repost/quote breakdown, hour-of-day distribution
   - `analyze_voice_style`: median length, hook archetypes with 5+ verbatim examples, vocabulary markers, emoji and CTA usage, tone clusters
   - `map_engagement_strategy`: who they reply to (account list, follower tiers), quote-tweet targets, reply timing, polls and giveaways

3. **Evidence**
   - `trace_growth_levers`: top 5% outliers, common triggers (controversy, utility, timing, piggybacking)
   - Every claim cites post URLs and numbers
   - Unknowns listed explicitly: no impression data, no per-post follower attribution, opaque ranking

4. **Playbook**
   - `generate_playbook`: 30-day calendar, 20 hook templates in the creator's voice, daily engagement checklist, weekly targets, measurement rubric
   - Output is executable by an agent: specific posts to draft, accounts to engage, metrics to track

## compare_creators

`compare_creators` normalizes 2-3 teardowns to isolate what is replicable (cadence, hook structure, reply targeting) from what is idiosyncratic (existing audience, offline reputation, timing luck).
