#!/usr/bin/env node
// vira CLI: setup, analyze, compare
// analyze runs the real pipeline: X API v2 fetch -> pattern/voice/engagement/levers -> JSON or playbook.
// Needs X_BEARER_TOKEN (X dev app, Basic tier $200/mo or higher).

import { Command } from 'commander';

const program = new Command();
program.name('vira').description("Reverse engineer any creator's X growth strategy").version('0.1.0');

program
  .command('setup')
  .description('Register VIRA MCP server and agent skill')
  .action(() => {
    console.log('VIRA setup:');
    console.log('1. Set X_BEARER_TOKEN from your X dev app (Basic tier, $200/mo or higher).');
    console.log('   export X_BEARER_TOKEN=<bearer token>');
    console.log('2. MCP server config: point your agent at src/mcp-server (see docs/SETUP.md).');
    console.log('3. Skill: skills/reverse-engineer-creator/SKILL.md');
    console.log('4. Restart your agent after setup.');
  });

program
  .command('analyze')
  .argument('<handle>', 'X handle like @levelsio')
  .option('--json', 'Output full teardown as JSON')
  .option('--playbook <days>', 'Emit playbook markdown (e.g. 30d)', '30d')
  .option('--days <n>', 'Lookback window in days', '120')
  .option('--limit <n>', 'Max posts to analyze', '200')
  .option('--niche <name>', 'Your niche, used by the playbook', 'your niche')
  .description('Analyze a creator: profile, top posts, patterns, voice, engagement, growth levers')
  .action(async (handle, opts) => {
    const { fetchUserPosts } = await import('../src/x-client.js');
    const {
      detectPostingPattern,
      analyzeVoiceStyle,
      mapEngagementStrategy,
      traceGrowthLevers,
      generatePlaybook,
    } = await import('../src/analyze.js');
    try {
      const days = parseInt(opts.days, 10) || 120;
      const limit = parseInt(opts.limit, 10) || 200;
      const { user, posts } = await fetchUserPosts(handle, { days, limit });
      if (!posts.length) {
        console.error(`No posts returned for @${handle.replace(/^@/, '')} in the last ${days} days.`);
        process.exit(2);
      }
      const teardown = {
        handle: user.username,
        user,
        corpus: { posts: posts.length, days },
        pattern: detectPostingPattern(posts),
        voice: analyzeVoiceStyle(posts),
        engagement: mapEngagementStrategy(posts),
        levers: traceGrowthLevers(posts),
        generatedAt: new Date().toISOString(),
      };
      if (opts.playbook !== undefined && !opts.json) {
        const n = parseInt(String(opts.playbook).replace(/d$/, ''), 10) || 30;
        console.log(generatePlaybook(teardown, opts.niche, n));
      } else {
        console.log(JSON.stringify(teardown, null, 2));
      }
    } catch (e) {
      console.error('Error:', e.message);
      process.exit(1);
    }
  });

program
  .command('compare')
  .argument('<handles...>', 'Handles like @a @b @c')
  .option('--focus <area>', 'Focus area: threads, replies, hooks, cadence', 'threads')
  .description('Side-by-side diff of 2-3 creators (fetches each via analyze pipeline)')
  .action(async (handles, opts) => {
    const { fetchUserPosts } = await import('../src/x-client.js');
    const { detectPostingPattern, analyzeVoiceStyle, mapEngagementStrategy } = await import('../src/analyze.js');
    try {
      const rows = [];
      for (const h of handles.slice(0, 3)) {
        const { user, posts } = await fetchUserPosts(h, { days: 90, limit: 120 });
        rows.push({
          handle: user.username,
          followers: user.followers,
          pattern: detectPostingPattern(posts).findings,
          voice: (analyzeVoiceStyle(posts).findings || {}).archetypes,
          engagement: mapEngagementStrategy(posts).findings,
        });
      }
      console.log(JSON.stringify({ focus: opts.focus, compare: rows }, null, 2));
    } catch (e) {
      console.error('Error:', e.message);
      process.exit(1);
    }
  });

program.parse();
