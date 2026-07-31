# SWAY Round 5: Data Pipeline — Signal-Aware Tool Use
## Claude Code Brief

*Supersedes `sway-round3-data-pipeline-brief.md`. This version is updated for the 7-tab Signals of Influence structure and the Round 4 outputs.*

---

## Build Summary

| | |
|---|---|
| **Data sources** | Google Trends (no key), Reddit API, YouTube Data API v3, Pinterest API (optional) |
| **Agents** | 6 total — Audience Lens, Brand Lens, Context Lens, Reconciliation, Scoring, Synthesis, Periphery (unchanged) |
| **Searches per agent** | 15 (each lens), 25 (Periphery) — unchanged |
| **Reconciliation tool calls** | 8 max (API lookups — Google Trends, Reddit, YouTube, Pinterest) |
| **Signal mapping** | Each tool call targets one of the four Signals of Influence (motivational / behavioral / trust / social) |
| **New UI sections** | "Signal Check" on Tab 1 (below the Signals Snapshot) · "Cultural Connectors" on Adjacencies (below Adjacency Insights) |
| **Also in this round** | Quadrant hover-label fix (Social tab) · leftover prompt refinements · Cultural Connectors (Periphery agent) |
| **Models** | Lens agents + Periphery: Sonnet 4.6 · Reconciliation + Synthesis: Fable 5 — unchanged |

---

## What This Round Does

Three things:

1. **Give the Reconciliation agent tool-use capability** so it can call platform APIs (Google Trends, Reddit, YouTube, Pinterest) on demand to validate and quantify what the lens agents found. It reads the three lens analyses, decides what claims need quantitative backing, and makes targeted API calls — organized around the four Signals of Influence.
2. **Add the Signal Check section** to Tab 1 — the validated quantitative findings, each tagged with the signal type it supports.
3. **Fix the quadrant label overlap** (now on the Social tab) and apply the leftover prompt refinements from the old Round 3 plan.

### Why tool-use instead of a data dump

An earlier design had a Batch 0 pre-step that extracted keywords from the audience description and blindly pulled API data before any research happened. Rejected for three reasons: keyword extraction before research produces bad queries; thousands of tokens of mostly-irrelevant platform data would bloat every lens prompt; and front-loading the same data into all three lenses breaks the lens independence that makes convergence meaningful.

With tool-use, the Reconciliation agent has already read three independent analyses. Its API calls are targeted: "the audience lens claims craft nights are the fastest-growing gathering format — let me check Google Trends for 'craft night' search growth" rather than "here's everything about crafting."

### Why signal-aware

Each platform is evidence for specific signal types (from Maria's API-to-signal mapping). Generic "validation" wastes calls; signal-aware validation tells the agent what each platform is *for*:

| Platform | Best for | What to look for |
|---|---|---|
| **Reddit** | Motivational + Social | First-person explanations, identity statements, values/tensions in posts; subreddits where conversations concentrate, recurring contributors, cross-posted interests. Also trust: recommendations with evidence cited, comments showing someone was persuaded. |
| **YouTube** | Behavioral + Trust | Demonstrations, routines, tutorials, "I bought this because of you" comments; creators repeatedly relied on for advice, engagement relative to channel size. |
| **Google Trends** | Behavioral + Trust | Action-oriented queries, interest growth, seasonal patterns, regional concentration, purchase-intent searches; "best/recommended" searches showing where people seek reassurance. |
| **Pinterest** | Behavioral + Social | Action-led searches, planned purchases, saved ideas, seasonal rituals; related keywords, co-occurring interests, adjacent categories. |

---

## Part 1: Reconciliation Agent — Tool-Use Architecture

### Concept

The Reconciliation agent currently produces its reconciled analysis in a single inference call. This round upgrades it to Claude tool-use (function calling) so it can make targeted API calls mid-analysis:

```
Reconciliation agent reads 3 lens outputs
  → identifies claims that need quantitative backing, organized by signal type
  → calls APIs strategically (up to 8 calls)
  → writes final reconciled analysis with quantitative evidence woven in
  → outputs a structured dataSignals section for the Signal Check UI
```

### Tool call cap

**Hard cap: 8 tool calls per run.** This protects against runaway loops and timeouts (a known problem). Enforce in code, not just prompt.

### Implementation

#### 1. API wrapper functions — `src/lib/data-tools.ts`

Plain async functions, NOT agents. All non-fatal — they return an error message string on failure (missing key, rate limit, timeout):

```typescript
async function searchGoogleTrends(query: string, timeRange?: string): Promise<GoogleTrendsResult | ToolError>
async function searchReddit(query: string, subreddit?: string): Promise<RedditResult | ToolError>
async function searchYouTube(query: string, maxResults?: number): Promise<YouTubeResult | ToolError>
async function searchPinterest(query: string): Promise<PinterestResult | ToolError>
```

Each function has a hard timeout (10s) so one slow API can't stall the pipeline.

#### 2. Tool schemas

```typescript
const reconciliationTools = [
  {
    name: "search_google_trends",
    description: "Check Google Trends search interest for a topic. Returns interest over time (12 months), trend direction (rising/stable/declining/breakout), percent change, related queries, top regions. BEST FOR: behavioral signals (action-oriented queries, interest growth, seasonal patterns, purchase-intent searches) and trust signals ('best'/'recommended' searches showing where people seek reassurance). No API key required.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Specific search term: 'craft night near me' not 'crafting'" },
        timeRange: { type: "string", enum: ["3m", "6m", "12m"], description: "Default: 12m" }
      },
      required: ["query"]
    }
  },
  {
    name: "search_reddit",
    description: "Search Reddit for community data. Returns relevant subreddits with subscriber counts, top recent posts with scores/comment counts, top comment excerpts. BEST FOR: motivational signals (first-person explanations, identity statements, values and tensions) and social signals (where conversations concentrate, community size, cross-posted interests). Also useful for trust signals (recommendations with evidence, persuasion in comment threads). Requires REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term for subreddits and posts" },
        subreddit: { type: "string", description: "Optional: search within a specific subreddit" }
      },
      required: ["query"]
    }
  },
  {
    name: "search_youtube",
    description: "Search YouTube videos. Returns titles, channel names, view/like/comment counts, publish dates, top comments. BEST FOR: behavioral signals (demonstrations, routines, tutorials, adoption reports) and trust signals (creators repeatedly relied on for advice, 'I bought this because of you' comments, engagement relative to channel size). Requires YOUTUBE_API_KEY.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term for videos" },
        maxResults: { type: "number", description: "Default 5, max 10" }
      },
      required: ["query"]
    }
  },
  {
    name: "search_pinterest",
    description: "Search Pinterest pins. Returns titles, descriptions, save counts, board names. BEST FOR: behavioral signals (planned purchases, saved ideas, seasonal rituals — Pinterest is intent-rich) and social signals (co-occurring interests, adjacent categories). Requires PINTEREST_ACCESS_TOKEN.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term for pins" }
      },
      required: ["query"]
    }
  }
];
```

#### 3. Tool-use loop

Refactor the Reconciliation call in `route.ts` from single inference to a tool-use loop:

```typescript
const messages = [{ role: "user", content: reconciliationPrompt + lensOutputs }];
let toolCallCount = 0;
const MAX_TOOL_CALLS = 8;

while (true) {
  const response = await anthropic.messages.create({
    model: RECONCILIATION_MODEL, // Fable 5, whatever string is currently used
    max_tokens: /* current reconciliation ceiling */,
    tools: reconciliationTools,
    messages
  });

  if (response.stop_reason === "tool_use") {
    const toolUse = response.content.find(b => b.type === "tool_use");
    messages.push({ role: "assistant", content: response.content });

    if (toolCallCount >= MAX_TOOL_CALLS) {
      messages.push({ role: "user", content: [{
        type: "tool_result", tool_use_id: toolUse.id,
        content: "TOOL BUDGET EXHAUSTED. Write your final reconciled analysis now with the data you have."
      }]});
    } else {
      const result = await executeDataTool(toolUse.name, toolUse.input);
      toolCallCount++;
      messages.push({ role: "user", content: [{
        type: "tool_result", tool_use_id: toolUse.id,
        content: JSON.stringify(result)
      }]});
      sendSSE({ step: "reconciliation-tool",
        message: `Checking ${toolUse.name.replace('search_','')}: "${toolUse.input.query}" (${toolCallCount}/8)` });
    }
    continue;
  }

  if (response.stop_reason === "end_turn") {
    // extract + parse final JSON as today
    break;
  }
}
```

Notes:
- Handle multiple tool_use blocks in one response if the model batches calls (execute all, return all results, count each against the budget).
- If ALL tools return "not configured" errors on their first use, the agent should stop calling tools and proceed qualitatively.
- The final output JSON schema is unchanged except for the added `dataSignals` field (Part 2).

#### 4. Reconciliation prompt addition

```
QUANTITATIVE VALIDATION — THE FOUR SIGNALS:
You have platform API tools to validate and quantify the lens findings. Each platform is evidence for specific Signals of Influence:

- MOTIVATIONAL signals (why they care): Reddit is your primary source — first-person explanations, identity statements, values and tensions in real posts.
- BEHAVIORAL signals (what they do): Google Trends (action-oriented queries, interest growth, seasonality, purchase intent), YouTube (tutorials, routines, adoption reports), Pinterest (planned purchases, saved ideas).
- TRUST signals (what earns belief): YouTube (creators repeatedly relied on for advice, engagement relative to channel size, "I bought this because of you"), Google Trends ("best"/"recommended" searches), Reddit (recommendations with evidence cited, visible persuasion).
- SOCIAL signals (where they gather): Reddit (subreddit size and concentration, recurring contributors, cross-posts), Pinterest (co-occurring interests).

TOOL USE BUDGET: Maximum 8 calls. Use them strategically:
- Prioritize claims where lenses DISAGREE — data can break the tie
- Prioritize claims about community size, creator reach, or trend direction — easily quantifiable
- Prioritize claims central to the influential core definition and the top-scored influence items
- Real-world habitat claims can often be validated digitally (e.g., "craft night" search growth, meetup-related subreddit activity)
- Don't spend calls on claims all three lenses agree on with strong evidence, or on subjective interpretations data can't resolve

After each result, reassess before calling again. Stop when you have enough for confident conclusions.

When you have data, weave it into your analysis with the same anti-confabulation discipline as everything else: report what the API returned, never extrapolate beyond it. If a call fails or returns nothing useful, note it and move on — do not retry, do not estimate what the data "probably" shows.

Not every tool will be available. If a key isn't configured the tool returns an error saying so — adapt, and note which sources were and weren't available in your output.
```

#### 5. SSE progress events

```
{ "step": "reconciliation", "message": "Reconciliation agent analyzing lens findings..." }
{ "step": "reconciliation-tool", "message": "Checking google_trends: \"craft night\" (1/8)" }
{ "step": "reconciliation-complete", "message": "Reconciliation complete — used 4/8 platform lookups" }
```

---

## Part 2: Signal Check (Tab 1)

The validated quantitative findings, displayed prominently. Every signal answers two questions: **what did the data show?** and **why does it matter?**

### Position

**Tab 1 (The Influential Core), directly below the Signals Snapshot.** The reading flow becomes: who the core is (description) → the four signals at a glance (snapshot) → what platform data verifies (signal check) → susceptibility, activation, approach/avoid.

### Output schema — added to Reconciliation output

```typescript
interface DataSignal {
  source: 'google_trends' | 'reddit' | 'youtube' | 'pinterest';
  signalType: 'motivational' | 'behavioral' | 'trust' | 'social';
  metric: string;          // headline number: "+103% YoY", "452K subscribers"
  subject: string;         // what it's about: "'craft night' searches", "r/knitting"
  finding: string;         // what the data showed (1 sentence)
  significance: string;    // why it matters (2-3 sentences, WITH comparisons/context)
  validates: string;       // which lens claim or report item this confirms/challenges
}

interface DataSignalsSynthesis {
  signals: DataSignal[];         // 3-6, ordered by strategic importance
  collectiveFinding: string;     // 3-5 sentence synthesis — what the data collectively reveals
  dataSources: string[];         // APIs successfully queried
  unavailableSources: string[];  // APIs not configured or failed
}

// ReconciliationOutput gains optional field:
//   dataSignals?: DataSignalsSynthesis
```

### The significance rule

Every signal MUST explain why the number matters, with context — comparisons, benchmarks, ratios, contrasts. Add to the reconciliation prompt:

```
DATA SIGNALS OUTPUT:
After your tool calls, structure the 3-6 most strategically significant findings into dataSignals. This is displayed prominently — it's intelligence, not an appendix.

- Tag each signal with the signalType it validates (motivational/behavioral/trust/social)
- Each significance MUST include context that makes the number meaningful. "452K subscribers" means nothing alone. "452K subscribers — 3x the next-largest fiber community, with 2.4x the average engagement ratio" tells a story.
- Frame significance as opportunity or risk, not observation
- The validates field names the specific lens claim or report item this data confirms or challenges
- collectiveFinding must say something the individual signals don't say alone
- If no tools were available, omit dataSignals entirely. NEVER generate estimated or plausible data.

Examples of GOOD significance:
- "'Craft night' searches up 103% YoY while 'craft business' queries are flat — the gathering behavior is growing but the monetization conversation isn't, confirming the anti-hustle finding with independent search data."
- "r/knitting's 2.4M subscribers dwarf r/craftbusiness's 40K — a 60:1 ratio. The community's center of gravity is overwhelmingly hobbyist, and commercial framings address a rounding error of the audience."

Examples of BAD significance (do not do this):
- "This subreddit has many subscribers, showing a significant community." (No comparison, no meaning)
- "Search interest is growing." (How fast? Against what baseline? So what?)
```

### UI — `SignalCheck.tsx`

- Renders only when `dataSignals` is present
- Header: "SIGNAL CHECK", subheading "Platform data validating the signals"
- 3-6 cards, each with: source badge (platform), **signalType badge** (motivational/behavioral/trust/social — colored consistently with the four signal tabs), prominent headline metric, subject, finding, significance text, and a muted "validates: …" line
- Synthesis paragraph below the cards, visually set apart (border/background) as the conclusion
- If `unavailableSources` is non-empty, muted footnote: "Data from [sources] was not available for this analysis"
- Cards stack on narrow viewports

---

## Part 3: Quadrant Hover Labels (Social Tab)

The Influence Quadrant (now on the Social tab) still has overlapping/truncated labels when items cluster.

Switch `InfluenceQuadrant.tsx` from always-on labels to hover-to-reveal:

- **Default:** dots only, colored by convergence status (converged / conflicted / single-lens as today). Zone labels ("The Hidden Core", "The Obvious", "The Periphery", "The Noise") and axis labels stay always-visible.
- **Hover:** tooltip near the dot — full item name, composite score, convergence status, behavioral role. Position to avoid covering other dots (prefer above; fall back below/left/right). Use a positioned HTML overlay div if the chart is SVG.
- **Click:** unchanged — jump to that item in the Influence Map on the same tab.

---

## Part 4: Leftover Prompt Refinements

Carried over from the old Round 3 plan; none were implemented. Apply to `src/lib/prompt.ts`:

### 4a. Entry point type taxonomy (synthesis)

```
Each entry point must be typed as one of:
- "community" — a specific group, forum, or community space to engage with
- "channel" — a distribution channel, content format, or media type
- "voice" — a specific type of person, creator, or voice to partner with or amplify
- "moment" — a temporal trigger, cultural moment, or life event to show up during
- "context" — a situational or environmental context where the audience is receptive
- "ritual" — a recurring behavior or routine to embed within
```

### 4b. reachLevel guidance (synthesis)

```
For each influence item, assign a reachLevel:
- "micro" — known only within a tight niche, <10K people aware
- "niche" — recognized within the audience but not beyond, 10K-100K
- "significant" — crosses into adjacent audiences, 100K-1M
- "mainstream" — broadly known, >1M, shows up in mainstream media

Base this on lens evidence, not assumption. If reach can't be determined, default to "niche" rather than guessing high.
```

### 4c. Search query specificity (all three lenses)

```
SEARCH STRATEGY: Avoid generic searches like "crafting community" or "fitness influencers". Search for specific signals: "Power Zone Pack Facebook group", "r/knitting stash guilt thread 2026", "LYS day event". Specific queries find real evidence; generic queries find marketing copy.
```

### 4d. Conflict depth (reconciliation)

```
When flagging a conflict between lenses, explain it specifically:
- What does each lens claim?
- Why might they disagree? (different sources, different framing of the same evidence, genuinely contradictory signals)
- What would resolve it? (more data — and now you may be able to GET that data via your tools — or is this a genuine tension the audience lives with?)

"Lenses disagree" is not useful. "The audience lens sees X as core identity while the brand lens sees it as declining trend, because they're looking at community behavior vs. market data" is strategically valuable.
```

---

## Part 5: API Implementation Details

### Google Trends
No key. `google-trends-api` npm package or direct HTTP. Return: interest over time (12mo), trend classification (rising/stable/declining/breakout), percent change, related queries, top regions. Cap ~800 tokens per result.

### Reddit
OAuth2 app-only. Create a script-type app at reddit.com/prefs/apps → `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`. Return: top 3 subreddits (name, subscribers, description) + top 5 posts (title, score, comment count) + top 3 comments per post (truncate 500 chars). Cap ~2000 tokens per result.

### YouTube
Data API v3, key from Google Cloud Console → `YOUTUBE_API_KEY`. Return: top 5 videos (title, channel, views, likes, comments, date) + top 3 comments each (truncate 300 chars). Cap ~1500 tokens per result.

### Pinterest (optional)
API v5, business account → `PINTEREST_ACCESS_TOKEN`. Return: top 10 pins (title, description, saves, board). Cap ~800 tokens per result. Skip if time-constrained.

### Environment variables

```
# All optional — a missing key disables that tool, pipeline still works
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
YOUTUBE_API_KEY=
PINTEREST_ACCESS_TOKEN=
# Google Trends needs no key
```

Document in README. On Railway, set these in the service environment settings.

---

## Part 6: Scoring Enhancement

Update the scoring guidance in the reconciliation prompt to use real metrics when available:

```
SCORING WITH PLATFORM DATA:
When you have tool-call data, ground your scores in it:
- Credibility: Reddit comment scores and community standing
- Transmission Power: YouTube view counts and Google Trends growth
- Participation Quality: Reddit engagement ratios (comments per post, thread depth)
- Bridge Potential: cross-subreddit activity, Google Trends related queries, Pinterest co-occurring interests

When platform data contradicts web-search findings, flag it explicitly. Data is not automatically more trustworthy than qualitative evidence — but the disagreement is strategically interesting.
```

---

## Part 7: Cultural Connectors (Adjacencies Tab)

The bridges between the influential core and broader culture: the voices, spaces, formats, and moments that carry influence *across* the boundaries the Adjacency Map draws. The map shows where the overlap territories are; this section shows who and what actually moves ideas across them.

**Generated by the Periphery agent** — it already researches adjacencies and receives the reconciled data (including bridge-potential scores and trust transfer paths). Synthesis cannot produce this section: it runs in parallel with Periphery and never sees its output.

### Periphery agent prompt addition

```
CULTURAL CONNECTORS:
From your adjacency research and the reconciled data, identify 3-6 connectors — the specific voices, spaces, formats, or moments that carry influence between the influential core and adjacent communities or broader culture. A connector is an observed bridge, not a suggested partner.

For each:
- connector: the archetype, space, format, or moment ("the multi-craftual crafter who brings knitters into quilting", "handmade gifts entering non-crafting households", "craft-night formats adopted by non-craft social groups")
- type: "voice" | "space" | "format" | "moment"
- bridges: what it connects — from where, to where ("core fiber-craft community → adjacent home/DIY audiences")
- mechanism: how influence actually travels across this bridge (1-2 sentences)
- evidence: what supports this — lens findings, adjacency research, documented behavior
- bridgeStrength: 0-100

Rules:
- Evidence-side only. These are observed bridges, NOT partnership or campaign recommendations.
- Anti-confabulation applies fully: named individuals only with repeated, specific evidence. Archetypes are usually the right level.
- Draw on the reconciled bridge-potential scores and trust transfer paths where they support a connector.
- If bridge evidence is thin, output fewer items and say so — do not pad.
```

### Type

```typescript
interface CulturalConnector {
  connector: string;
  type: 'voice' | 'space' | 'format' | 'moment';
  bridges: string;       // "from → to"
  mechanism: string;
  evidence: string;
  bridgeStrength: number; // 0-100
}
// Added to the Periphery agent's output schema as an optional culturalConnectors array
```

### UI

New section on the **Adjacencies tab, below Adjacency Insights**. Header: "CULTURAL CONNECTORS", subheading "The bridges that carry influence between the core and broader culture." Cards ordered by bridgeStrength descending, type as a small badge, bridges rendered as a from → to line. Renders only when `culturalConnectors` is present — old reports show nothing.

---

## Part 8: Backward Compatibility

- Old reports have no `dataSignals` → Signal Check doesn't render. No errors. Same for `culturalConnectors`.
- No API keys configured → agent runs without useful tools, proceeds qualitatively, output identical in shape to today, Signal Check absent.
- Partial keys → agent adapts, notes available/unavailable sources.
- Reconciliation output schema unchanged except the added optional `dataSignals`.
- No renames of existing JSON keys, no localStorage changes.

---

## Implementation Order

1. **Quadrant hover labels** (Part 3) — self-contained quick win
2. **Prompt refinements** (Part 4) — text-only
3. **API wrappers** (Part 5) — `data-tools.ts`, test each function standalone (a simple script hitting each API)
4. **Tool schemas + tool-use loop** (Part 1) — with the 8-call cap enforced in code
5. **SSE progress events** (Part 1)
6. **Reconciliation prompt additions** (Parts 1, 2, 6) — signal mapping, budget, dataSignals format, scoring
7. **`DataSignal` types + `SignalCheck.tsx`** (Part 2) — wired into Tab 1 below the Signals Snapshot
8. **Cultural Connectors** (Part 7) — periphery prompt + schema + UI section on Adjacencies tab. Independent of the tool-use work — if the round needs de-scoping to protect the pipeline, cut this first.
9. **Test ladder:** no keys → Google Trends only → all keys (see Testing)

---

## Testing

1. **No keys** — report runs identically to today. No Signal Check. No errors. Agent doesn't burn its budget retrying dead tools.
2. **Google Trends only** — agent makes 1-3 trends calls; Signal Check shows trend-sourced cards with signalType badges; unavailable sources footnoted.
3. **All keys** — 4-8 calls across sources; cards from multiple platforms and multiple signal types; collectiveFinding says something beyond the individual cards.
4. **Signal quality gate** — every significance has a comparison/benchmark/ratio and reads as opportunity or risk. "This community is large" = fail. "60:1 hobbyist-to-commercial subscriber ratio, so commercial framings address a rounding error" = pass.
5. **Signal-type accuracy** — spot-check that signalType tags make sense (subreddit size = social, search growth = behavioral, "best X" searches = trust, first-person identity posts = motivational).
6. **Cap enforcement** — agent stops at 8 even if it wants more; SSE shows (8/8); final analysis still completes.
7. **Timeout** — full pipeline completes within acceptable time; one hung API call doesn't stall the run (10s per-tool timeout works).
8. **Validates field** — each signal names a real lens claim or report item; the claim exists in the report.
9. **Quadrant hover** — tooltips on hover, no overlap, click-through works, mobile/narrow behavior sane.
10. **Prompt refinements** — entry points use the taxonomy; reachLevel populated and meaningfully distributed; conflicts have explanatory depth.
11. **Old reports** — render correctly, no Signal Check, no Cultural Connectors, no errors.
12. **Anti-confabulation** — where the agent references platform data in prose, the numbers match actual tool results (spot-check against logs). No extrapolated or estimated metrics anywhere.
13. **Cultural Connectors** — 3-6 connectors on the Adjacencies tab below Adjacency Insights, ordered by bridgeStrength; each is an observed bridge with evidence, not a partnership suggestion; no invented named individuals; thin evidence produces fewer items, not padding.
