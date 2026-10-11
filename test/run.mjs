// Test harness: runs VIRA analysis over a synthetic 20-post corpus.
// Usage: node test/run.mjs
import {
  detectPostingPattern,
  analyzeVoiceStyle,
  mapEngagementStrategy,
  traceGrowthLevers,
  generatePlaybook,
  engagementScore,
} from '../src/analyze.js';
import { normalizeTweet } from '../src/x-client.js';

const H = 3600 * 1000;
const base = Date.UTC(2026, 8, 1, 14, 0, 0); // Sept 1 2026 14:00 UTC
let n = 0;
const mk = (over) =>
  normalizeTweet({
    id: `t${++n}`,
    text: over.text,
    created_at: new Date(base + (over.dayOffset || 0) * 24 * H + (over.hourJitter || 0) * H).toISOString(),
    public_metrics: {
      like_count: over.likes || 0,
      retweet_count: over.reposts || 0,
      reply_count: over.replies || 0,
      quote_count: over.quotes || 0,
    },
    referenced_tweets: over.refs || [],
    conversation_id: over.convo || `t${n}`,
    entities: over.entities || {},
    lang: 'en',
    ...(over.inReplyToUserId ? { in_reply_to_user_id: over.inReplyToUserId } : {}),
  }, { u1: { username: 'bigfounder' }, u2: { username: 'startupdaily' } });

// 8 originals with varied hooks
const posts = [
  mk({ text: 'I spent 30 days building in public. It added $4k MRR with zero ad spend.', likes: 900, reposts: 120, replies: 60, dayOffset: 0 }),
  mk({ text: '7 mistakes that cost me 2 years as a solo founder:', likes: 700, reposts: 200, replies: 40, dayOffset: 2 }),
  mk({ text: 'I was wrong about paid ads. The data changed my mind:', likes: 150, reposts: 20, replies: 25, dayOffset: 4 }),
  mk({ text: 'Unpopular opinion: nobody needs a co-founder to hit $10k MRR.', likes: 1200, reposts: 300, replies: 180, dayOffset: 6 }),
  mk({ text: 'How I ship a product every month without burning out:', likes: 400, reposts: 90, replies: 30, dayOffset: 8 }),
  mk({ text: 'What is the one metric you check every morning?', likes: 80, reposts: 5, replies: 45, dayOffset: 10 }),
  mk({ text: 'Shipped v2 today. Signup conversion went from 2.1% to 3.4%.', likes: 220, reposts: 30, replies: 18, dayOffset: 12 }),
  mk({ text: 'Just a quiet build day. Fixed onboarding copy.', likes: 25, reposts: 1, replies: 3, dayOffset: 14 }),
  // 3-post thread (same convo)
  mk({ text: 'I make $150k/mo as a solo founder. 5 things I would do differently:', likes: 2500, reposts: 800, replies: 200, dayOffset: 16, convo: 'c1' }),
  mk({ text: '2/ First: charge from day one. Free users never convert.', likes: 300, reposts: 40, replies: 20, dayOffset: 16, hourJitter: 0.05, convo: 'c1' }),
  mk({ text: '3/ Second: one audience, many products. Follow for the rest.', likes: 280, reposts: 35, replies: 15, dayOffset: 16, hourJitter: 0.1, convo: 'c1' }),
  // replies
  mk({ text: '@bigfounder This matches my numbers exactly. The first $1k MRR is the hardest.', likes: 90, reposts: 2, replies: 4, dayOffset: 1, refs: [{ type: 'replied_to', id: 'x1' }], inReplyToUserId: 'u1' }),
  mk({ text: '@bigfounder Counterpoint: ads worked for my devtool at $30 CAC.', likes: 120, reposts: 3, replies: 9, dayOffset: 5, refs: [{ type: 'replied_to', id: 'x2' }], inReplyToUserId: 'u1' }),
  mk({ text: '@startupdaily Great thread. The pricing section is gold.', likes: 15, reposts: 0, replies: 1, dayOffset: 9, refs: [{ type: 'replied_to', id: 'x3' }], inReplyToUserId: 'u2' }),
  mk({ text: '@bigfounder Thirding this. Shipping beats planning.', likes: 40, reposts: 1, replies: 2, dayOffset: 13, refs: [{ type: 'replied_to', id: 'x4' }], inReplyToUserId: 'u1' }),
  // quote
  mk({ text: 'This is the best breakdown of indie pricing I have seen. My addition: annual plans first.', likes: 180, reposts: 25, replies: 12, dayOffset: 3, refs: [{ type: 'quoted', id: 'q1' }] }),
  // more originals
  mk({ text: 'September revenue: $12,400 MRR. Up 18% from August.', likes: 650, reposts: 60, replies: 35, dayOffset: 18 }),
  mk({ text: 'Stop optimizing your landing page. Talk to 10 users instead.', likes: 500, reposts: 110, replies: 55, dayOffset: 20 }),
  mk({ text: 'Two years ago I had $0 MRR. Today $12k. The one decision: charge early.', likes: 800, reposts: 150, replies: 70, dayOffset: 22 }),
  mk({ text: 'gm', likes: 8, reposts: 0, replies: 1, dayOffset: 24 }),
];

const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); process.exit(1); } };

const pattern = detectPostingPattern(posts);
assert(pattern.findings.totalPosts === 20, 'totalPosts should be 20');
assert(pattern.findings.replies === 4, 'replies should be 4, got ' + pattern.findings.replies);
assert(pattern.findings.threads === 1, 'threads should be 1');
assert(pattern.findings.longestThread === 3, 'longestThread should be 3');
assert(pattern.findings.postsPerDay === 0.83, 'postsPerDay should be 0.83, got ' + pattern.findings.postsPerDay);
assert(pattern.findings.topHoursUTC[0].hourUTC === 14, 'top hour should be 14 UTC');

const voice = analyzeVoiceStyle(posts);
const arch = Object.fromEntries(voice.findings.archetypes.map((a) => [a.name, a.count]));
assert(arch['number-led'] >= 4, 'number-led should be >= 4, got ' + JSON.stringify(arch));
assert(arch['contrarian'] >= 2, 'contrarian should be >= 2');
assert(voice.evidence.length === 5, 'should have 5 hook evidence items');
assert(voice.evidence[0].likes === 2500, 'top hook should be the 2500-like thread opener');

const engagement = mapEngagementStrategy(posts);
assert(engagement.findings.replyTargets[0].username === 'bigfounder', 'top reply target should be bigfounder');
assert(engagement.findings.replyTargets[0].replyCount === 3, 'bigfounder replies should be 3');
assert(engagement.findings.replyShare === 0.2, 'replyShare should be 0.2');

const levers = traceGrowthLevers(posts);
assert(levers.findings.postsScored === 20, 'should score 20 posts');
assert(levers.evidence[0].likes === 2500, 'top outlier should be the 2500-like post');
assert(levers.evidence[0].multipleOfBaseline > 5, 'top outlier should be >5x baseline, got ' + levers.evidence[0].multipleOfBaseline);
assert(levers.evidence[0].triggers.includes('revenue-number'), 'top outlier should trigger revenue-number');

const teardown = {
  user: { username: 'testfounder', followers: 42000 },
  pattern, voice, engagement, levers,
};
const playbook = generatePlaybook(teardown, 'AI agents', 30);
assert(playbook.includes('20.') || (playbook.match(/^\d+\. /gm) || []).length >= 15, 'playbook should have ~20 hook templates');
assert(playbook.includes('@bigfounder'), 'playbook should name the top reply target');

console.log('All assertions passed.');
console.log('--- pattern ---');
console.log(JSON.stringify(pattern.findings, null, 2));
console.log('--- top archetypes ---');
console.log(JSON.stringify(voice.findings.archetypes.slice(0, 4)));
console.log('--- top outlier ---');
console.log(JSON.stringify(levers.evidence[0], null, 2));
console.log('--- engagementScore sanity:', engagementScore({ likes: 100, reposts: 10, replies: 10, quotes: 2 }), '(expect 136)');
