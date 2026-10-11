#!/usr/bin/env node
// vira CLI: analyze, compare, setup
// Mirrors rea-agents CLI pattern: npx vira-agents setup, vira analyze @handle --json

import { Command } from 'commander';

const program = new Command();
program.name('vira').description('Reverse engineer any creator on X').version('0.1.0');

program
  .command('setup')
  .description('Register VIRA MCP server and agent skill')
  .action(() => {
    console.log('VIRA setup:');
    console.log('1. MCP server config would be written to your agent config');
    console.log('2. Skill installed to skills/reverse-engineer-creator/SKILL.md');
    console.log('3. Restart your agent after setup');
    console.log('\nManual MCP config: see docs/SETUP.md');
  });

program
  .command('analyze')
  .argument('<handle>', 'X handle like @levelsio')
  .option('--json', 'Output full teardown as JSON')
  .option('--playbook <days>', 'Emit playbook markdown (e.g. 30d)')
  .description('Analyze a creator: profile, top posts, patterns, voice, engagement, growth levers')
  .action((handle, opts) => {
    const h = handle.replace(/^@/, '');
    if (opts.json) {
      console.log(JSON.stringify({
        handle: h,
        note: 'Scaffold: connect X API v2 here. See src/mcp-server.ts for tool wiring.',
        steps: [
          'analyze_creator_profile',
          'fetch_top_posts',
          'detect_posting_pattern',
          'analyze_voice_style',
          'map_engagement_strategy',
          'trace_growth_levers',
          opts.playbook ? 'generate_playbook' : null
        ].filter(Boolean)
      }, null, 2));
    } else if (opts.playbook) {
      console.log(`# 30-day playbook for @${h}\n`);
      console.log('_Scaffold: wire generate_playbook MCP tool here._');
      console.log('\nSee PROMPT.md for the full agent prompt to run this end to end.');
    } else {
      console.log(`Analyzing @${h}... (scaffold: implement X API fetch in src/)`);
    }
  });

program
  .command('compare')
  .argument('<handles...>', 'Handles like @a @b @c')
  .option('--focus <area>', 'Focus area: threads, replies, hooks, cadence', 'threads')
  .description('Side-by-side diff of 2-3 creators')
  .action((handles, opts) => {
    console.log(JSON.stringify({
      handles: handles.map(h => h.replace(/^@/, '')),
      focus: opts.focus,
      note: 'Scaffold: implement compare_creators here.'
    }, null, 2));
  });

program.parse();
