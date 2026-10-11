# VIRA test run: @levelsio teardown (manual, 2026-10-11)

**Target:** @levelsio (Pieter Levels), Dutch solo founder, nomad, no employees, no VC.
**Method:** Manual collect from public sources (VIRA X API wiring is still TODO, so this run uses public web evidence, not the automated MCP pipeline).
**Window:** Public posts and bio numbers as of Sept 2026.

## Profile snapshot

- Portfolio of dozens of launches since 2013, most died. Positioning: entrepreneurship closer to pro sports than "anyone can do it."
- X bio numbers on 10 Sept 2026 (they float): Photo AI ~$90k/mo, a game product ~$44k/mo, another product ~$25k/mo, Interior AI ~$21k/mo, X payouts ~$20k/mo, another ~$12k/mo.
- In Aug 2026 he wrote that his marketing spend is negative and X pays him ~$17k/month.
- Older markers: Nomad List since 2014 (profitable from day one), Remote OK since 2015, MAKE book landing long claimed hundreds of thousands of copies / about $1M, fly.pieter.com vibe-coded and launched on day 17 into tens of thousands per month quickly.
- Portfolio estimate from secondary coverage: ~$150k/month across Nomad List (~$40k), Remote OK (~$70k), other (~$40k) as of 2025-2026.

## Posting pattern (observed from public interviews and compilations)

- Build in public as the channel: revenue numbers, screenshots, what broke, what shipped. The feed does triple duty: traffic, feedback, social proof.
- Big milestones over small updates: he has said small fixes ("fix the color of this button") are too small for X; post big features or big problems solved, framed as a story.
- Cadence signal: "every day is launch day", constant shipping into the feed rather than one Product Hunt per year.
- Threads: long-form explainers exist (e.g. the 2017 TL;DR MBA thread), but day-to-day distribution leans on single sharp posts with numbers.

## Voice fingerprint

- Concrete over abstract: landing headlines like "a CRM that has AI and doesn't suck" rather than "enter the new dimension of CRMs".
- Numbers first: revenue figures, timelines ("idea to product in 6-12 hours"), prices.
- Contrarian and blunt: "marketing spend is negative", "if it's good enough it should be able to sell itself", skepticism of pumping UGC and ads.
- No hype scaffolding: short sentences, plain claims, lets the number carry the post.

## Engagement strategy

- Direct engagement on social: answers queries, joins conversations, uses the feed for feedback rather than broadcast only.
- One audience, neighbor products: Remote OK served the same people as Nomad List, so every post compounds one audience instead of splitting across markets.
- Creators beat PR: one niche video creator lifted MRR from ~$12k to $40-50k and held it; press logos did not.
- Launches: soft launch to his own X feed first, then Product Hunt / Show HN only if there is something to show. Factual titles, first comment explains what it is and what feedback he wants.

## Growth levers (with evidence)

1. **Revenue transparency as distribution.** Monthly MRR breakdowns across products. He has called publishing revenue his single best marketing decision: it generates press, shares, and ongoing attention. Source: bio numbers Sept 2026 and his Aug 2026 "X pays me" post.
2. **Build-in-public flywheel.** Ship, screenshot, revenue update, lesson. Each cycle gives the feed something concrete and gives the product social proof.
3. **Programmatic SEO as the quiet engine.** Nomad List ranks for thousands of cities because each city is its own data page, not a blog. This is off-X distribution that compounds without posting.
4. **Negative marketing spend.** By Aug-Sept 2026 he was not spending on ads or UGC; X payouts (~$17-20k/mo) made distribution net positive.

## Unknowns (public data cannot show)

- Per-post impression counts and per-post follower attribution: X does not expose these publicly.
- True reply-to-follower conversion: private analytics only.
- Algorithmic ranking reasons for any specific post: opaque.
- Paid or bot amplification: not detectable from public data.

## Replicable playbook excerpt (for an AI-agent founder niche)

1. One personal pain, one promise in one sentence, a Stripe price. No free tier to "validate".
2. Ship in days, post the same day the pay button exists. Fulfill first orders by hand.
3. Weekly: 1 revenue or metric screenshot with a real number, 2 blunt lessons or contrarian takes in your niche, daily build update with a concrete before/after.
4. 10-30 real selling attempts per week: your feed, narrow communities, DMs to people with the pain.
5. If payments and repeats appear in 1-2 weeks, automate the narrowest bottleneck. If not, change the promise or niche, never add features.
6. Neighbor products only: every launch should serve the same audience you already reach.

## Sources

- Indie solo playbook compilation (bio numbers 10 Sept 2026, launch system, distribution notes)
- StarterStory Nomad List breakdown (portfolio ~$150k/mo, launch steps)
- Levels interview on building in public (Twitter as the feedback channel; big features as stories, not small fixes)
- aicmo X engagement research (2026-02-10): Premium reach dynamics, 70/30 engage/create, short threads

## Verdict on the test

VIRA's contract held: every claim above traces to a public source, unknowns are explicit, and the output is a runnable 30-day shape. What the scaffold cannot do yet: pull the actual 200-post corpus, compute the cadence histogram, or quote 5 verbatim hooks. That needs X API v2 wiring in src/mcp-server.ts.
