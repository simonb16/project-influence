// ─── Round 5: Platform data tools for the Reconciliation agent ───────────────
// Plain async functions, NOT agents. All non-fatal: they return { error }
// on any failure (missing key, rate limit, timeout, bad response) so one
// broken API can never sink a run. Each call has a hard 10s timeout.
//
// Tools are only registered (getAvailableTools) when their required env vars
// are present — the agent never sees an unconfigured tool. Reddit/Pinterest
// activate automatically once their keys land in .env, no code changes.

import googleTrends from "google-trends-api";

export interface ToolError {
  error: string;
}

const TOOL_TIMEOUT_MS = 10_000;

/** Hard cap on reconciliation tool calls per run — enforced in the agent loop. */
export const MAX_TOOL_CALLS = 8;

function isToolError(v: unknown): v is ToolError {
  return typeof v === "object" && v !== null && "error" in v;
}

/** Wrap any tool promise in a hard timeout so a hung API can't stall the pipeline. */
async function withTimeout<T>(work: Promise<T>, label: string): Promise<T | ToolError> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<ToolError>((resolve) => {
    timer = setTimeout(() => resolve({ error: `${label} timed out after ${TOOL_TIMEOUT_MS / 1000}s` }), TOOL_TIMEOUT_MS);
  });
  try {
    return await Promise.race([work, timeout]);
  } catch (err) {
    return { error: `${label} failed: ${err instanceof Error ? err.message : String(err)}` };
  } finally {
    clearTimeout(timer);
  }
}

function truncate(s: string | undefined | null, max: number): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// ─── Google Trends (no key — unofficial endpoints via google-trends-api) ─────

export interface GoogleTrendsResult {
  query: string;
  timeRange: string;
  trendDirection: "rising" | "stable" | "declining" | "breakout";
  percentChange: string; // e.g. "+103%" comparing start vs end of window
  interestOverTime: Array<{ period: string; value: number }>; // downsampled
  relatedQueriesTop: string[];
  relatedQueriesRising: string[];
  topRegions: string[];
}

const TIME_RANGE_MONTHS: Record<string, number> = { "3m": 3, "6m": 6, "12m": 12 };

async function googleTrendsInner(query: string, timeRange = "12m"): Promise<GoogleTrendsResult | ToolError> {
  const months = TIME_RANGE_MONTHS[timeRange] ?? 12;
  const startTime = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);

  const raw = await googleTrends.interestOverTime({ keyword: query, startTime });
  let parsed: { default?: { timelineData?: Array<{ formattedAxisTime?: string; formattedTime?: string; value?: number[] }> } };
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Google returns an HTML block page instead of JSON when the unofficial
    // endpoint is throttled or has moved — surface that clearly.
    return { error: "google_trends returned a non-JSON response (unofficial endpoint throttled or unavailable) — do not retry this tool" };
  }

  const timeline = parsed.default?.timelineData ?? [];
  if (timeline.length === 0) {
    return { error: `google_trends returned no data for "${query}" — the term may be too niche for Trends` };
  }

  const values = timeline.map((t) => t.value?.[0] ?? 0);
  const head = values.slice(0, Math.max(4, Math.floor(values.length / 6)));
  const tail = values.slice(-Math.max(4, Math.floor(values.length / 6)));
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / Math.max(arr.length, 1);
  const headAvg = avg(head);
  const tailAvg = avg(tail);

  let percentChange: string;
  let trendDirection: GoogleTrendsResult["trendDirection"];
  if (headAvg === 0 && tailAvg > 0) {
    percentChange = "breakout (from zero baseline)";
    trendDirection = "breakout";
  } else {
    const pct = headAvg === 0 ? 0 : Math.round(((tailAvg - headAvg) / headAvg) * 100);
    percentChange = `${pct >= 0 ? "+" : ""}${pct}%`;
    trendDirection = pct > 400 ? "breakout" : pct > 15 ? "rising" : pct < -15 ? "declining" : "stable";
  }

  // Downsample the timeline to ~12 points to respect the token cap
  const step = Math.max(1, Math.floor(timeline.length / 12));
  const interestOverTime = timeline
    .filter((_, i) => i % step === 0)
    .map((t) => ({ period: t.formattedAxisTime ?? t.formattedTime ?? "", value: t.value?.[0] ?? 0 }));

  // Related queries + regions are best-effort — partial failure is fine
  let relatedQueriesTop: string[] = [];
  let relatedQueriesRising: string[] = [];
  let topRegions: string[] = [];
  try {
    const relRaw = await googleTrends.relatedQueries({ keyword: query, startTime });
    const rel = JSON.parse(relRaw);
    const ranked = rel.default?.rankedList ?? [];
    relatedQueriesTop = (ranked[0]?.rankedKeyword ?? []).slice(0, 5).map((k: { query: string }) => k.query);
    relatedQueriesRising = (ranked[1]?.rankedKeyword ?? []).slice(0, 5).map((k: { query: string }) => k.query);
  } catch { /* best-effort */ }
  try {
    const regRaw = await googleTrends.interestByRegion({ keyword: query, startTime });
    const reg = JSON.parse(regRaw);
    topRegions = (reg.default?.geoMapData ?? [])
      .filter((g: { value?: number[] }) => (g.value?.[0] ?? 0) > 0)
      .sort((a: { value?: number[] }, b: { value?: number[] }) => (b.value?.[0] ?? 0) - (a.value?.[0] ?? 0))
      .slice(0, 5)
      .map((g: { geoName?: string }) => g.geoName ?? "");
  } catch { /* best-effort */ }

  return {
    query,
    timeRange,
    trendDirection,
    percentChange,
    interestOverTime,
    relatedQueriesTop,
    relatedQueriesRising,
    topRegions,
  };
}

export async function searchGoogleTrends(query: string, timeRange?: string): Promise<GoogleTrendsResult | ToolError> {
  return withTimeout(googleTrendsInner(query, timeRange), "google_trends");
}

// ─── Reddit (OAuth2 app-only) ────────────────────────────────────────────────

export interface RedditResult {
  query: string;
  subreddits: Array<{ name: string; subscribers: number; description: string }>;
  posts: Array<{
    title: string;
    subreddit: string;
    score: number;
    numComments: number;
    topComments: string[];
  }>;
}

const REDDIT_UA = "web:sway-influence-engine:v0.5 (research tool)";

async function redditToken(): Promise<string> {
  const id = process.env.REDDIT_CLIENT_ID!;
  const secret = process.env.REDDIT_CLIENT_SECRET!;
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": REDDIT_UA,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`reddit auth failed (${res.status})`);
  const json = await res.json();
  return json.access_token;
}

async function redditInner(query: string, subreddit?: string): Promise<RedditResult | ToolError> {
  const token = await redditToken();
  const headers = { Authorization: `Bearer ${token}`, "User-Agent": REDDIT_UA };

  // Subreddit discovery (skip when scoped to one subreddit)
  let subreddits: RedditResult["subreddits"] = [];
  if (!subreddit) {
    const subRes = await fetch(
      `https://oauth.reddit.com/subreddits/search?q=${encodeURIComponent(query)}&limit=3`,
      { headers }
    );
    if (subRes.ok) {
      const subJson = await subRes.json();
      subreddits = (subJson.data?.children ?? []).map((c: { data: { display_name_prefixed: string; subscribers: number; public_description: string } }) => ({
        name: c.data.display_name_prefixed,
        subscribers: c.data.subscribers ?? 0,
        description: truncate(c.data.public_description, 200),
      }));
    }
  }

  // Post search
  const searchUrl = subreddit
    ? `https://oauth.reddit.com/r/${encodeURIComponent(subreddit.replace(/^r\//, ""))}/search?q=${encodeURIComponent(query)}&restrict_sr=1&sort=top&t=year&limit=5`
    : `https://oauth.reddit.com/search?q=${encodeURIComponent(query)}&sort=top&t=year&limit=5`;
  const postRes = await fetch(searchUrl, { headers });
  if (!postRes.ok) return { error: `reddit search failed (${postRes.status})` };
  const postJson = await postRes.json();
  const rawPosts = (postJson.data?.children ?? []) as Array<{
    data: { title: string; subreddit_name_prefixed: string; score: number; num_comments: number; permalink: string };
  }>;

  // Top comments for the top 2 posts only (keeps calls + tokens bounded)
  const posts: RedditResult["posts"] = [];
  for (let i = 0; i < rawPosts.length; i++) {
    const p = rawPosts[i].data;
    let topComments: string[] = [];
    if (i < 2 && p.permalink) {
      try {
        const cRes = await fetch(`https://oauth.reddit.com${p.permalink}?limit=3&depth=1&sort=top`, { headers });
        if (cRes.ok) {
          const cJson = await cRes.json();
          topComments = (cJson[1]?.data?.children ?? [])
            .filter((c: { kind: string }) => c.kind === "t1")
            .slice(0, 3)
            .map((c: { data: { body: string } }) => truncate(c.data.body, 500));
        }
      } catch { /* best-effort */ }
    }
    posts.push({
      title: truncate(p.title, 200),
      subreddit: p.subreddit_name_prefixed,
      score: p.score,
      numComments: p.num_comments,
      topComments,
    });
  }

  return { query, subreddits, posts };
}

export async function searchReddit(query: string, subreddit?: string): Promise<RedditResult | ToolError> {
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    return { error: "reddit is not configured (REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET missing) — do not retry this tool" };
  }
  return withTimeout(redditInner(query, subreddit), "reddit");
}

// ─── YouTube (Data API v3) ───────────────────────────────────────────────────

export interface YouTubeResult {
  query: string;
  videos: Array<{
    title: string;
    channel: string;
    views: number;
    likes: number;
    comments: number;
    published: string;
    topComments: string[];
  }>;
}

async function youtubeInner(query: string, maxResults = 5): Promise<YouTubeResult | ToolError> {
  const key = process.env.YOUTUBE_API_KEY!;
  const n = Math.min(Math.max(maxResults, 1), 10);

  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${n}&q=${encodeURIComponent(query)}&key=${key}`
  );
  if (!searchRes.ok) {
    const body = await searchRes.text();
    return { error: `youtube search failed (${searchRes.status}): ${truncate(body, 200)}` };
  }
  const searchJson = await searchRes.json();
  const items = (searchJson.items ?? []) as Array<{
    id: { videoId: string };
    snippet: { title: string; channelTitle: string; publishedAt: string };
  }>;
  if (items.length === 0) return { error: `youtube returned no videos for "${query}"` };

  const ids = items.map((i) => i.id.videoId).join(",");
  const statsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}&key=${key}`
  );
  const statsJson = statsRes.ok ? await statsRes.json() : { items: [] };
  const statsById: Record<string, { viewCount?: string; likeCount?: string; commentCount?: string }> = {};
  for (const v of statsJson.items ?? []) statsById[v.id] = v.statistics ?? {};

  const videos: YouTubeResult["videos"] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const stats = statsById[item.id.videoId] ?? {};
    // Top comments for the top 3 videos only
    let topComments: string[] = [];
    if (i < 3) {
      try {
        const cRes = await fetch(
          `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${item.id.videoId}&maxResults=3&order=relevance&textFormat=plainText&key=${key}`
        );
        if (cRes.ok) {
          const cJson = await cRes.json();
          topComments = (cJson.items ?? []).map((c: { snippet: { topLevelComment: { snippet: { textDisplay: string } } } }) =>
            truncate(c.snippet.topLevelComment.snippet.textDisplay, 300)
          );
        }
      } catch { /* comments can be disabled — best-effort */ }
    }
    videos.push({
      title: truncate(item.snippet.title, 150),
      channel: item.snippet.channelTitle,
      views: Number(stats.viewCount ?? 0),
      likes: Number(stats.likeCount ?? 0),
      comments: Number(stats.commentCount ?? 0),
      published: item.snippet.publishedAt?.slice(0, 10) ?? "",
      topComments,
    });
  }

  return { query, videos };
}

export async function searchYouTube(query: string, maxResults?: number): Promise<YouTubeResult | ToolError> {
  if (!process.env.YOUTUBE_API_KEY) {
    return { error: "youtube is not configured (YOUTUBE_API_KEY missing) — do not retry this tool" };
  }
  return withTimeout(youtubeInner(query, maxResults), "youtube");
}

// ─── Pinterest (API v5 — untested until a token exists) ─────────────────────

export interface PinterestResult {
  query: string;
  pins: Array<{ title: string; description: string; board: string; link: string }>;
}

async function pinterestInner(query: string): Promise<PinterestResult | ToolError> {
  const token = process.env.PINTEREST_ACCESS_TOKEN!;
  const res = await fetch(
    `https://api.pinterest.com/v5/search/pins?query=${encodeURIComponent(query)}&page_size=10`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const body = await res.text();
    return { error: `pinterest search failed (${res.status}): ${truncate(body, 200)}` };
  }
  const json = await res.json();
  // Note: Pinterest v5 does not expose public save counts on searched pins;
  // return the descriptive fields that exist.
  const pins = ((json.items ?? []) as Array<{ title?: string; description?: string; board_owner?: { username?: string }; link?: string }>)
    .slice(0, 10)
    .map((p) => ({
      title: truncate(p.title, 120),
      description: truncate(p.description, 200),
      board: p.board_owner?.username ?? "",
      link: truncate(p.link, 120),
    }));
  return { query, pins };
}

export async function searchPinterest(query: string): Promise<PinterestResult | ToolError> {
  if (!process.env.PINTEREST_ACCESS_TOKEN) {
    return { error: "pinterest is not configured (PINTEREST_ACCESS_TOKEN missing) — do not retry this tool" };
  }
  return withTimeout(pinterestInner(query), "pinterest");
}

// ─── Tool schemas + availability-gated registration ──────────────────────────

export interface DataToolSchema {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}

const TOOL_SCHEMAS: Array<{ schema: DataToolSchema; isConfigured: () => boolean }> = [
  {
    isConfigured: () => process.env.DISABLE_DATA_TOOLS !== "1",
    schema: {
      name: "search_google_trends",
      description:
        "Check Google Trends search interest for a topic. Returns interest over time (12 months), trend direction (rising/stable/declining/breakout), percent change, related queries, top regions. BEST FOR: behavioral signals (action-oriented queries, interest growth, seasonal patterns, purchase-intent searches) and trust signals ('best'/'recommended' searches showing where people seek reassurance).",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Specific search term: 'craft night near me' not 'crafting'" },
          timeRange: { type: "string", enum: ["3m", "6m", "12m"], description: "Default: 12m" },
        },
        required: ["query"],
      },
    },
  },
  {
    isConfigured: () =>
      process.env.DISABLE_DATA_TOOLS !== "1" &&
      !!process.env.REDDIT_CLIENT_ID &&
      !!process.env.REDDIT_CLIENT_SECRET,
    schema: {
      name: "search_reddit",
      description:
        "Search Reddit for community data. Returns relevant subreddits with subscriber counts, top recent posts with scores/comment counts, top comment excerpts. BEST FOR: motivational signals (first-person explanations, identity statements, values and tensions) and social signals (where conversations concentrate, community size, cross-posted interests). Also useful for trust signals (recommendations with evidence, persuasion in comment threads).",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search term for subreddits and posts" },
          subreddit: { type: "string", description: "Optional: search within a specific subreddit" },
        },
        required: ["query"],
      },
    },
  },
  {
    isConfigured: () => process.env.DISABLE_DATA_TOOLS !== "1" && !!process.env.YOUTUBE_API_KEY,
    schema: {
      name: "search_youtube",
      description:
        "Search YouTube videos. Returns titles, channel names, view/like/comment counts, publish dates, top comments. BEST FOR: behavioral signals (demonstrations, routines, tutorials, adoption reports) and trust signals (creators repeatedly relied on for advice, 'I bought this because of you' comments, engagement relative to channel size).",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search term for videos" },
          maxResults: { type: "number", description: "Default 5, max 10" },
        },
        required: ["query"],
      },
    },
  },
  {
    isConfigured: () => process.env.DISABLE_DATA_TOOLS !== "1" && !!process.env.PINTEREST_ACCESS_TOKEN,
    schema: {
      name: "search_pinterest",
      description:
        "Search Pinterest pins. Returns titles, descriptions, board names. BEST FOR: behavioral signals (planned purchases, saved ideas, seasonal rituals — Pinterest is intent-rich) and social signals (co-occurring interests, adjacent categories).",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search term for pins" },
        },
        required: ["query"],
      },
    },
  },
];

/** Only tools whose env requirements are met — the agent never sees the rest. */
export function getAvailableTools(): DataToolSchema[] {
  return TOOL_SCHEMAS.filter((t) => t.isConfigured()).map((t) => t.schema);
}

/** Dispatch a tool call by name. Unknown names return an error, never throw. */
export async function executeDataTool(name: string, input: Record<string, unknown>): Promise<object> {
  const query = String(input.query ?? "");
  switch (name) {
    case "search_google_trends":
      return searchGoogleTrends(query, input.timeRange ? String(input.timeRange) : undefined);
    case "search_reddit":
      return searchReddit(query, input.subreddit ? String(input.subreddit) : undefined);
    case "search_youtube":
      return searchYouTube(query, input.maxResults ? Number(input.maxResults) : undefined);
    case "search_pinterest":
      return searchPinterest(query);
    default:
      return { error: `unknown tool: ${name}` };
  }
}

export { isToolError };
