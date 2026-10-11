#!/usr/bin/env node
// Run the VIRA analysis pipeline over a corpus JSON file {user, posts}.
// This is the second half of the "Muse runs it" path: bin/vira_fetch.py fetches
// with the vault credential, this file analyzes.
//
// Usage:
//   node cli/analyze-file.mjs <corpus.json> [--json] [--playbook [days]] [--niche "name"]

import { readFileSync } from 'node:fs';
import {
  detectPostingPattern,
  analyzeVoiceStyle,
  mapEngagementStrategy,
  traceGrowthLevers,
  generatePlaybook,
} from '../src/analyze.js';

const [,, file, ...rest] = process.argv;
if (!file) {
  console.error('Usage: node cli/analyze-file.mjs <corpus.json> [--json] [--playbook [days]] [--niche "name"]');
  process.exit(2);
}

const corpus = JSON.parse(readFileSync(file, 'utf8'));
const { user, posts } = corpus;
if (!user || !Array.isArray(posts)) {
  console.error('Corpus JSON must be {user, posts}.');
  process.exit(2);
}

const teardown = {
  handle: user.username,
  user,
  corpus: { posts: posts.length },
  pattern: detectPostingPattern(posts),
  voice: analyzeVoiceStyle(posts),
  engagement: mapEngagementStrategy(posts),
  levers: traceGrowthLevers(posts),
  generatedAt: new Date().toISOString(),
};

const nicheFlag = rest.indexOf('--niche');
const niche = nicheFlag >= 0 ? rest[nicheFlag + 1] : 'your niche';

if (rest.includes('--playbook')) {
  const i = rest.indexOf('--playbook');
  const days = parseInt(String(rest[i + 1] || '30').replace(/d$/, ''), 10) || 30;
  console.log(generatePlaybook(teardown, niche, days));
} else {
  console.log(JSON.stringify(teardown, null, 2));
}
