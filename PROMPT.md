# PROMPT: Grow my X account to 100k with VIRA

Copy this into Muse (or your agent) after running `npx vira-agents setup`.

---

**Prompt:**

Grow my X account to 100k followers like @TARGET_HANDLE.

Reverse engineer their posting strategy with VIRA:

1. Call `analyze_creator_profile` for @TARGET_HANDLE, then `fetch_top_posts` (120 days, top 200 by engagement).
2. In parallel: `detect_posting_pattern`, `analyze_voice_style`, `map_engagement_strategy`.
3. Call `trace_growth_levers` to find the top 5% virality outliers and what triggered them.
4. Call `compare_creators` with @TARGET_HANDLE and two adjacent creators in the same niche to isolate what is replicable vs idiosyncratic.
5. Call `generate_playbook` for a 30-day execution plan targeting 100k followers.

Rules:
- Cite every quantitative claim with post URLs and exact engagement numbers. Never fabricate metrics.
- State unknowns explicitly (no impression data, no per-post follower attribution from public X data).
- Voice fingerprint must include 5+ real hook examples quoted verbatim.
- The playbook must be executable starting tomorrow: daily cadence, 20 hook templates in their voice adapted to my niche (my niche: MY_NICHE), daily engagement checklist with specific account types to target, weekly follower and engagement targets, and a measurement rubric.

Then, after I approve the playbook, draft the first 7 days of posts and the daily engagement checklist.

---

Replace @TARGET_HANDLE with the creator to reverse engineer, and MY_NICHE with your niche (e.g. AI agents, indie hacking, fintech).

**Example:**

Grow my X account to 100k followers like @levelsio. Reverse engineer their posting strategy with VIRA: [steps above]. My niche: AI agents and founder distribution.
