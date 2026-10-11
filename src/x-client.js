// VIRA X API v2 client. App-only Bearer auth.
//
// Requires X API Basic ($200/mo) or higher for GET /2/users/:id/tweets.
// The Free tier is effectively unusable for this (100 reads/mo, 1 req/24h on most endpoints).
// Auth: export X_BEARER_TOKEN=<bearer token> from an X dev app.

const API_BASE = 'https://api.x.com/2';
const PAGE_SIZE = 100;

export function bearerToken() {
  const t = process.env.X_BEARER_TOKEN;
  if (!t) {
    throw new Error(
      'X_BEARER_TOKEN is not set. Create an X dev app on the Basic tier ($200/mo), ' +
      'copy its Bearer Token, and run: export X_BEARER_TOKEN=<token>'
    );
  }
  return t;
}

async function apiGet(path, params, token, attempt = 0) {
  const url = new URL(API_BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 429) {
    if (attempt >= 3) throw new Error('X API rate limit hit 3 times in a row, aborting.');
    const reset = Number(res.headers.get('x-rate-limit-reset') || 0);
    const waitMs = Math.min(Math.max(reset * 1000 - Date.now() + 1000, 1000), 15 * 60 * 1000);
    await new Promise((r) => setTimeout(r, waitMs));
    return apiGet(path, params, token, attempt + 1);
  }
  if (res.status === 401 || res.status === 403) {
    const body = await res.text();
    throw new Error(
      `X API auth failed (${res.status}). Check X_BEARER_TOKEN and that the app is on Basic tier or higher. ${body.slice(0, 200)}`
    );
  }
  if (!res.ok) {
    throw new Error(`X API ${res.status} on ${path}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.json();
}

// Resolve @handle to a user id plus public profile metrics.
export async function resolveUser(handle, token = bearerToken()) {
  const h = handle.replace(/^@/, '');
  const json = await apiGet(
    '/users/by',
    { usernames: h, 'user.fields': 'created_at,description,public_metrics' },
    token
  );
  const u = json.data && json.data[0];
  if (!u) throw new Error(`X user not found: @${h}`);
  const pm = u.public_metrics || {};
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    description: u.description || '',
    followers: pm.followers_count ?? null,
    following: pm.following_count ?? null,
    tweetCount: pm.tweet_count ?? null,
    createdAt: u.created_at || null,
  };
}

const TWEET_FIELDS =
  'created_at,public_metrics,entities,referenced_tweets,conversation_id,lang,note_tweet,attachments';

// Normalize one v2 tweet into VIRA's post shape. Pure function, exported for tests.
export function normalizeTweet(t, usersById = {}) {
  const pm = t.public_metrics || {};
  const refs = (t.referenced_tweets || []).map((r) => r.type);
  const text = (t.note_tweet && t.note_tweet.text) || t.text || '';
  const entities = t.entities || {};
  const urls = entities.urls || [];
  return {
    id: t.id,
    url: `https://x.com/i/status/${t.id}`,
    text,
    createdAt: t.created_at,
    likes: pm.like_count || 0,
    reposts: pm.retweet_count || 0,
    replies: pm.reply_count || 0,
    quotes: pm.quote_count || 0,
    views: pm.impression_count ?? null,
    lang: t.lang || null,
    conversationId: t.conversation_id || null,
    isReply: refs.includes('replied_to'),
    isQuote: refs.includes('quoted'),
    isOriginal: refs.length === 0,
    inReplyToUserId: t.in_reply_to_user_id || null,
    inReplyToUsername: (usersById[t.in_reply_to_user_id] || {}).username || null,
    hashtags: (entities.hashtags || []).map((h) => h.tag),
    mentions: (entities.mentions || []).map((m) => m.username),
    hasMedia: !!(
      (t.attachments && t.attachments.media_keys && t.attachments.media_keys.length) ||
      urls.some((u) => u.media_key)
    ),
    hasLink: urls.length > 0,
  };
}

// Fetch the corpus: newest-first pages of the user's own tweets (retweets excluded,
// replies kept so mapEngagementStrategy can see reply targets).
export async function fetchUserPosts(
  handle,
  { days = 120, limit = 200, includeReplies = true } = {},
  token = bearerToken()
) {
  const user = await resolveUser(handle, token);
  const since = new Date(Date.now() - days * 86400 * 1000);
  const params = {
    max_results: PAGE_SIZE,
    'tweet.fields': TWEET_FIELDS,
    expansions: 'in_reply_to_user_id',
    'user.fields': 'username',
    exclude: 'retweets',
    start_time: since.toISOString().slice(0, 19) + 'Z',
  };
  const posts = [];
  const usersById = {};
  let paginationToken;
  const maxPages = Math.ceil(limit / PAGE_SIZE) + 2;
  for (let page = 0; page < maxPages; page++) {
    if (paginationToken) params.pagination_token = paginationToken;
    const json = await apiGet(`/users/${user.id}/tweets`, params, token);
    for (const u of (json.includes && json.includes.users) || []) {
      usersById[u.id] = { username: u.username };
    }
    for (const t of json.data || []) {
      const p = normalizeTweet(t, usersById);
      if (!includeReplies && p.isReply) continue;
      posts.push(p);
      if (posts.length >= limit) break;
    }
    if (posts.length >= limit || !json.meta || !json.meta.next_token) break;
    paginationToken = json.meta.next_token;
  }
  return { user, posts: posts.slice(0, limit) };
}
