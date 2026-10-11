// VIRA MCP server: tool definitions below. The real workflow layer lives in
// ./x-client.js (X API v2 fetch + normalize) and ./analyze.js (pure analysis).
// CLI (cli/index.js) runs the same pipeline; wire these handlers to it once
// @modelcontextprotocol/sdk is installed.

export const TOOLS = [
  {
    name: 'analyze_creator_profile',
    description: 'Fetch public profile: bio, followers, niche, pinned posts, posting window',
    inputSchema: {
      type: 'object',
      properties: { handle: { type: 'string', description: 'X handle without @' } },
      required: ['handle']
    }
  },
  {
    name: 'fetch_top_posts',
    description: 'Fetch top-N posts by engagement with text, timestamps, URLs, metrics',
    inputSchema: {
      type: 'object',
      properties: {
        handle: { type: 'string' },
        days: { type: 'number', default: 120 },
        limit: { type: 'number', default: 200 }
      },
      required: ['handle']
    }
  },
  {
    name: 'detect_posting_pattern',
    description: 'Cadence histogram, thread ratio, media usage, reply/repost/quote breakdown, hour-of-day',
    inputSchema: {
      type: 'object',
      properties: { handle: { type: 'string' } },
      required: ['handle']
    }
  },
  {
    name: 'analyze_voice_style',
    description: 'Voice fingerprint: hook archetypes, length stats, vocabulary markers, tone clusters',
    inputSchema: {
      type: 'object',
      properties: { handle: { type: 'string' } },
      required: ['handle']
    }
  },
  {
    name: 'map_engagement_strategy',
    description: 'Reply targets, quote-tweet patterns, reply-guying, polls and giveaways',
    inputSchema: {
      type: 'object',
      properties: { handle: { type: 'string' } },
      required: ['handle']
    }
  },
  {
    name: 'trace_growth_levers',
    description: 'Virality outliers: which posts drove disproportionate engagement and likely triggers',
    inputSchema: {
      type: 'object',
      properties: { handle: { type: 'string' } },
      required: ['handle']
    }
  },
  {
    name: 'compare_creators',
    description: 'Side-by-side pattern, voice, engagement diff of 2-3 creators',
    inputSchema: {
      type: 'object',
      properties: {
        handles: { type: 'array', items: { type: 'string' } },
        focus: { type: 'string', default: 'threads' }
      },
      required: ['handles']
    }
  },
  {
    name: 'generate_playbook',
    description: 'Emit 30-day playbook: cadence, hook bank, engagement checklist, targets, rubric',
    inputSchema: {
      type: 'object',
      properties: {
        handle: { type: 'string' },
        goal: { type: 'string', default: '100k followers' },
        days: { type: 'number', default: 30 }
      },
      required: ['handle']
    }
  }
];

// TODO: implement MCP server bootstrap with @modelcontextprotocol/sdk
// Each handler must return { findings, evidence: [{postUrl, metrics}], unknowns: [...] }
console.log('VIRA MCP tools defined:', TOOLS.map(t => t.name).join(', '));
