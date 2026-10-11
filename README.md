# VIRA: Reverse Engineer Any Creator

### One MCP for reverse engineering creator growth strategies on X.

**See an account growing. Understand how it works, down to the post level.**

VIRA connects your agent to tools for inspecting public creator activity on X: profiles, top posts, posting cadence, voice patterns, and engagement tactics. You can also use the same tools from your terminal. Analysis runs locally, and results include the evidence and limitations behind each conclusion.

Setup registers VIRA with your agent and installs matching workflow instructions.

> **Note:** This is a research scaffold. X API access and rate limits apply. All metrics cited must come from fetched data, never fabricated.

## Quick start

### Set up your agent

With Node.js and npm installed, run:

```
npx vira-agents setup
```

Choose your agents, review the proposed changes, and approve them. Setup adds VIRA's MCP server and matching workflow instructions, with backups of existing configuration. Restart your agent afterward.

Setup supports Claude Code, Muse, Cursor, and other MCP-compatible agents. See docs/SETUP.md for manual MCP registration.

### Ask your agent

```
Grow my X account to 100k followers like @levelsio: reverse engineer their posting strategy, show me the evidence, and build me a 30-day playbook I can execute.
```

Replace @levelsio with your target creator.

### Use the terminal

Analyze a creator to stdout as JSON:

```
npx -y vira-agents@latest analyze @levelsio --json
```

Generate a 30-day playbook:

```
npx -y vira-agents@latest analyze @levelsio --playbook 30d > playbook-30d.md
```

Compare creators:

```
npx -y vira-agents@latest compare @a @b @c --focus threads
```

To install the `vira` command for regular use:

```
npm install --global vira-agents
vira --help
```

## How VIRA works

Your agent calls VIRA through MCP to collect the target creator's public posts and profile data, then runs pattern mining across post types, cadence, voice, and engagement.

VIRA returns findings with their evidence: post URLs, engagement numbers, and explicit unknowns. The agent uses them to ask follow-up questions, explain the strategy, or write and test a playbook.

CLI commands use the same workflows.

```
collect -> pattern-mine -> evidence -> playbook
```

1. **Collect**: pull last 90-180 days of public posts (top 200 by engagement), profile metadata, timestamps
2. **Pattern-mine**: post-type taxonomy, cadence histogram, format fingerprints, virality outliers
3. **Evidence**: every claim cites post URLs and numbers, unknowns stated explicitly
4. **Playbook**: 30-day execution spec with hook templates, cadence, engagement checklist

## What you can analyze

| Target | What VIRA returns | Requirements |
| --- | --- | --- |
| Creator profile | Bio, follower count, niche, pinned posts, posting window | X API Basic or scraping fallback |
| Top posts | Full text, timestamps, URLs, likes/reposts/replies | X API v2 timeline |
| Posting pattern | Cadence histogram, thread ratio, media usage, hour-of-day | Computed from collected posts |
| Voice style | Hook archetypes, length stats, tone clusters | LLM analysis over post corpus |
| Engagement strategy | Reply targets, quote-tweet patterns, reply-guying | Public reply/quote graph |
| Growth levers | Virality outliers and common triggers | Engagement delta analysis |
| Creator comparison | Side-by-side diff of 2-3 creators | Same as above, normalized |

**Limitations (surfaced in every output):** no impression data for other accounts, no true per-post follower attribution from public data, ranking algorithm opaque, DMs and private communities invisible, paid/bot amplification not detectable publicly.

## Showcases

### @levelsio: build-in-public as a compounding loop
How monthly MRR screenshots, indie-hacker milestones, and contrarian hot-takes form a 3-post-type flywheel. See showcases/01-levelsio.md.

### The 10k to 100k thread funnel
Reconstructing a finance creator's thread cadence: 2 long threads per week, hook under 12 words, CTA in final tweet. See showcases/02-thread-funnel.md.

### Reply-guy arbitrage
Mapping how a mid-size creator grew to 40k by replying within 30 minutes to 10 large accounts daily. See showcases/03-reply-guy.md.

## Documentation

- docs/HOW_IT_WORKS.md: the collect to playbook loop in detail
- docs/SETUP.md: manual MCP registration
- docs/LIMITATIONS.md: data sources and unknowns
- skills/reverse-engineer-creator/SKILL.md: agent investigation instructions

## Disclaimer

VIRA analyzes public data only. Respect X Terms of Service and rate limits. Do not scrape in violation of platform rules. Follower growth is not guaranteed.

## Contributing

PRs welcome. Include the target creator, your question, how VIRA helped, and what you found.

## License

MIT
