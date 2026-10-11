// VIRA analysis: pure functions over a normalized post corpus (see x-client.js).
// No network, no secrets. Every function returns { findings, evidence, unknowns }.

const round2 = (n) => Math.round(n * 100) / 100;

function median(nums) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

// --- detect_posting_pattern -------------------------------------------------

export function detectPostingPattern(posts) {
  if (!posts.length) return { findings: null, evidence: [], unknowns: ['Corpus is empty.'] };
  const sorted = [...posts].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const daysSpanned = Math.max(
    1,
    Math.round((new Date(sorted[sorted.length - 1].createdAt) - new Date(sorted[0].createdAt)) / 86400000)
  );
  const originals = posts.filter((p) => p.isOriginal);
  const replies = posts.filter((p) => p.isReply);
  const quotes = posts.filter((p) => p.isQuote && !p.isReply);

  const hours = new Array(24).fill(0);
  for (const p of posts) hours[new Date(p.createdAt).getUTCHours()]++;
  const topHoursUTC = hours
    .map((count, hourUTC) => ({ hourUTC, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Threads: originals sharing one conversation_id, in time order.
  const convos = new Map();
  for (const p of originals) {
    if (!p.conversationId) continue;
    if (!convos.has(p.conversationId)) convos.set(p.conversationId, []);
    convos.get(p.conversationId).push(p);
  }
  const threads = [...convos.values()]
    .filter((g) => g.length > 1)
    .map((g) => g.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
  const threadPosts = threads.reduce((s, g) => s + g.length, 0);

  return {
    findings: {
      totalPosts: posts.length,
      daysSpanned,
      postsPerDay: round2(posts.length / daysSpanned),
      originals: originals.length,
      replies: replies.length,
      quotes: quotes.length,
      replyShare: round2(replies.length / posts.length),
      threads: threads.length,
      threadPosts,
      threadShareOfOriginals: originals.length ? round2(threadPosts / originals.length) : 0,
      avgThreadLength: threads.length ? round2(threadPosts / threads.length) : 0,
      longestThread: threads.length ? Math.max(...threads.map((g) => g.length)) : 0,
      medianChars: median(posts.map((p) => p.text.length)),
      mediaShare: round2(posts.filter((p) => p.hasMedia).length / posts.length),
      linkShare: round2(posts.filter((p) => p.hasLink).length / posts.length),
      topHoursUTC,
    },
    evidence: threads.slice(0, 3).map((g) => ({ kind: 'thread', length: g.length, firstPostUrl: g[0].url })),
    unknowns: [
      'Hours are UTC; the author local timezone is not exposed by the API.',
      'View counts are only present when the API returns impression_count.',
    ],
  };
}

// --- analyze_voice_style ----------------------------------------------------

const ARCHETYPES = [
  { name: 'number-led', re: /^\d+|(\$?\d[\d,.]*\s?(k|m|%|x\b))|(\d+\s?(ways|mistakes|lessons|years|rules|steps))/i },
  { name: 'question', re: /\?\s*$/ },
  { name: 'first-person-story', re: /^i\s/i },
  { name: 'how-to', re: /\bhow (to|i)\b|here'?s how/i },
  { name: 'contrarian', re: /\b(never|no one|nobody|everyone is wrong|stop |don'?t |unpopular opinion|hot take)\b/i },
  { name: 'announcement', re: /^(launch|shipped|just released|introducing|we just|today i (launched|shipped))/i },
];

const CTA_RE = /follow|subscribe|check it out|link in bio|comment|repost|retweet|👇/i;
const EMOJI_RE = /\p{Extended_Pictographic}/gu;

export function tagArchetypes(text) {
  return ARCHETYPES.filter((a) => a.re.test(text)).map((a) => a.name);
}

export function analyzeVoiceStyle(posts) {
  const originals = posts.filter((p) => p.isOriginal);
  if (!originals.length) return { findings: null, evidence: [], unknowns: ['No original posts in corpus.'] };

  const archetypeCounts = {};
  for (const p of originals) {
    for (const name of tagArchetypes(p.text)) archetypeCounts[name] = (archetypeCounts[name] || 0) + 1;
  }
  const archetypes = Object.entries(archetypeCounts)
    .map(([name, count]) => ({ name, count, share: round2(count / originals.length) }))
    .sort((a, b) => b.count - a.count);

  const byLikes = [...originals].sort((a, b) => b.likes - a.likes).slice(0, 5);
  const emojiCounts = originals.map((p) => (p.text.match(EMOJI_RE) || []).length);

  return {
    findings: {
      originalsAnalyzed: originals.length,
      medianChars: median(originals.map((p) => p.text.length)),
      archetypes,
      avgEmojisPerPost: round2(emojiCounts.reduce((s, n) => s + n, 0) / originals.length),
      ctaShare: round2(originals.filter((p) => CTA_RE.test(p.text)).length / originals.length),
      hashtagShare: round2(originals.filter((p) => p.hashtags.length > 0).length / originals.length),
    },
    evidence: byLikes.map((p) => ({
      kind: 'hook',
      hook: p.text.slice(0, 80),
      archetypes: tagArchetypes(p.text),
      likes: p.likes,
      url: p.url,
    })),
    unknowns: ['Tone clusters need an LLM pass over the corpus; this is regex-level fingerprinting.'],
  };
}

// --- map_engagement_strategy ------------------------------------------------

export function mapEngagementStrategy(posts) {
  const replies = posts.filter((p) => p.isReply);
  const quotes = posts.filter((p) => p.isQuote && !p.isReply);
  const targetCounts = {};
  for (const p of replies) {
    const name = p.inReplyToUsername || p.inReplyToUserId || 'unknown';
    targetCounts[name] = (targetCounts[name] || 0) + 1;
  }
  const replyTargets = Object.entries(targetCounts)
    .map(([username, replyCount]) => ({ username, replyCount }))
    .sort((a, b) => b.replyCount - a.replyCount)
    .slice(0, 10);

  return {
    findings: {
      totalPosts: posts.length,
      replies: replies.length,
      quotes: quotes.length,
      replyShare: posts.length ? round2(replies.length / posts.length) : 0,
      quoteShare: posts.length ? round2(quotes.length / posts.length) : 0,
      replyTargets,
      distinctReplyTargets: Object.keys(targetCounts).length,
    },
    evidence: replyTargets.slice(0, 5).map((t) => ({ kind: 'reply-target', username: t.username, replies: t.replyCount })),
    unknowns: [
      'Reply timing relative to the parent post needs parent timestamps, not collected here.',
      'Quote-tweet targets need quoted-tweet expansion; only counts are reported.',
      'DMs, private communities, and alt accounts are invisible in public data.',
    ],
  };
}

// --- trace_growth_levers ----------------------------------------------------

export function engagementScore(p) {
  return p.likes + 2 * p.reposts + 1.5 * p.replies + 0.5 * p.quotes;
}

const TRIGGER_RES = [
  { name: 'revenue-number', re: /(\$|mrr|revenue|\d+\s?k\/mo)/i },
  { name: 'milestone', re: /\b(launched|shipped|just hit|reached|profitable)\b/i },
  { name: 'contrarian', re: /\b(never|no one|nobody|everyone is wrong|stop |don'?t |unpopular opinion)\b/i },
  { name: 'question', re: /\?\s*$/ },
];

export function traceGrowthLevers(posts) {
  if (!posts.length) return { findings: null, evidence: [], unknowns: ['Corpus is empty.'] };
  const scored = posts.map((p) => ({ post: p, score: engagementScore(p) }));
  const baseline = median(scored.map((s) => s.score));
  const ranked = [...scored].sort((a, b) => b.score - a.score);
  const n = Math.max(3, Math.ceil(ranked.length * 0.05));
  const outliers = ranked.slice(0, n).map(({ post: p, score }) => ({
    url: p.url,
    text: p.text.slice(0, 120),
    score: Math.round(score),
    likes: p.likes,
    reposts: p.reposts,
    replies: p.replies,
    multipleOfBaseline: baseline ? round2(score / baseline) : null,
    triggers: TRIGGER_RES.filter((t) => t.re.test(p.text)).map((t) => t.name),
    archetypes: tagArchetypes(p.text),
  }));
  return {
    findings: {
      postsScored: posts.length,
      medianScore: Math.round(baseline),
      scoreFormula: 'likes + 2*reposts + 1.5*replies + 0.5*quotes',
      outlierCount: outliers.length,
      topOutlierMultiple: outliers[0] ? outliers[0].multipleOfBaseline : null,
    },
    evidence: outliers,
    unknowns: [
      'Score is a proxy; true follower attribution per post is not exposed by the X API.',
      'Impression counts are account-private and absent from public responses.',
    ],
  };
}

// --- generate_playbook ------------------------------------------------------

export function generatePlaybook(teardown, niche = 'your niche', days = 30) {
  const { user, pattern, voice, engagement, levers } = teardown;
  const p = (pattern && pattern.findings) || {};
  const v = (voice && voice.findings) || {};
  const e = (engagement && engagement.findings) || {};
  const l = (levers && levers.findings) || {};
  const perDay = p.postsPerDay || 2;
  const dailyPosts = Math.max(1, Math.round(perDay));
  const topArchetypes = (v.archetypes || []).slice(0, 3).map((a) => a.name);
  const hookBank = buildHookBank(topArchetypes, niche);

  return `# ${days}-day playbook: grow like @${user.username} in ${niche}
_Generated ${new Date().toISOString().slice(0, 10)} from ${p.totalPosts || 0} analyzed posts over ${p.daysSpanned || 0} days._

## The model
- Cadence to match: ${perDay} posts/day (${p.originals || 0} originals, ${p.replies || 0} replies, ${p.threads || 0} threads in the sample)
- Voice to borrow: ${(topArchetypes.join(', ') || 'direct, number-led')}
- Outlier baseline: median engagement score ${l.medianScore || 'n/a'}; top outlier hit ${l.topOutlierMultiple || 'n/a'}x baseline
- Reply engine: ${(e.replyShare * 100 || 0).toFixed(0)}% of output was replies; top targets: ${(e.replyTargets || []).slice(0, 5).map((t) => '@' + t.username).join(', ') || 'niche accounts over 50k'}

## Weekly cadence (repeat x${Math.ceil(days / 7)})
- ${dailyPosts} original posts/day: 1 metric or milestone post, 1 blunt lesson or contrarian take, rest build updates
- 1 thread/week (${p.avgThreadLength || 8}-part average): hook under 12 words, payoff in the middle, CTA in the final post
- 5 targeted replies/day to accounts over 50k in ${niche}, within 30 minutes of their post, value-add format (a number, a counter-example, a 3-bullet expansion)

## Hook bank (20 templates in their voice, adapted to ${niche})
${hookBank.map((h, i) => `${i + 1}. ${h}`).join('\n')}

## Daily engagement checklist
- [ ] Reply to 5 large accounts in ${niche} (first 30 min after they post)
- [ ] 1 original post with a real number from your work
- [ ] Quote-tweet 1 good post in ${niche} with a substantive addition
- [ ] Log: posts, replies, profile visits, follower delta

## Weekly targets
- Week 1-2: find your 3 repeatable formats; kill the rest
- Week 3-4: double down on the format with the best reply-to-like ratio
- Measure: follower delta per week, median engagement score vs baseline ${l.medianScore || 'n/a'}, reply hit rate (replies over 10 likes)

## What this cannot promise
- Per-post follower attribution is not measurable from public X data; treat follower deltas as directional.
- Algorithmic ranking is opaque; cadence and format are inputs, not guarantees.
`;
}

function buildHookBank(archetypes, niche) {
  const bank = [];
  const push = (s) => bank.push(s);
  if (archetypes.includes('number-led') || !archetypes.length) {
    push(`I spent 30 days doing [${niche} tactic]. It added $[number]/mo.`);
    push(`7 mistakes that cost me [number] [months/users] in ${niche}.`);
    push(`$[number]/mo from ${niche} with zero ad spend. Here is the breakdown:`);
    push(`[number] years in ${niche}. [number] things I wish I knew at the start:`);
  }
  if (archetypes.includes('contrarian') || !archetypes.length) {
    push(`Unpopular opinion in ${niche}: [widely held belief] is wrong.`);
    push(`Stop [common ${niche} advice]. Do [counter-move] instead.`);
    push(`Nobody in ${niche} will tell you this, but [uncomfortable truth].`);
    push(`Your ${niche} [metric] does not matter. This does:`);
  }
  if (archetypes.includes('first-person-story') || !archetypes.length) {
    push(`I [failed at / tried] [${niche} thing]. Here is what actually happened:`);
    push(`I was wrong about [${niche} belief]. The data changed my mind:`);
    push(`Two years ago I [starting point]. Today [result]. The one decision that mattered:`);
  }
  if (archetypes.includes('how-to') || !archetypes.length) {
    push(`How I [${niche} outcome] without [thing people assume is required]:`);
    push(`Here is how [${niche} process] actually works, step by step:`);
  }
  if (archetypes.includes('question') || !archetypes.length) {
    push(`What is the one ${niche} metric you check every morning?`);
    push(`Why does everyone in ${niche} [common behavior]?`);
  }
  push(`Shipped [${niche} thing] today. [One concrete number or before/after].`);
  push(`[Screenshot of ${niche} result]. [One sentence on what changed].`);
  push(`If I had to restart in ${niche} tomorrow, I would do exactly this:`);
  push(`The ${niche} playbook nobody writes down:`);
  return bank.slice(0, 20);
}
