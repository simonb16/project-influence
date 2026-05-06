import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LOG_FILE = path.join(process.cwd(), "agent.log");

function log(message: string) {
  const line = `[${new Date().toLocaleTimeString("en-US", { hour12: false })}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

// Tool type helper
type WebSearchTool = {
  type: "web_search_20250305";
  name: "web_search";
  max_uses: number;
};

const SEARCH_TOOL: WebSearchTool = {
  type: "web_search_20250305",
  name: "web_search",
  max_uses: 15,
};

interface AgentMeta {
  sourcesScanned: number;
  communitiesFound: number;
  conversationsSampled: number;
  uniqueVoices: number;
  searchCount: number;
  platforms: string[];
}

interface AgentSource {
  url?: string;
  platform: string;
  description: string;
  relevance: string;
}

const ACCURACY_RULE = `
⚠ CRITICAL ACCURACY RULE — READ BEFORE SEARCHING:
Never fabricate, guess, or approximate specific factual details. This includes: full names, subscriber/follower counts, view counts, dates, statistics, quotes, and any other specific data point. If you found the detail directly in a search result, include it. If you did not find it or are not certain, you MUST either:
• Omit the detail entirely, OR
• Use only the portion you are confident about (e.g. first name only if unsure of the last name), OR
• Set "unverified": true on that entry in your JSON output

It is far better to write "YouTube creator with a large following" than to guess "2.3M subscribers" when you didn't read that exact number. It is far better to write a first name only than to invent a last name. Never round, estimate, or reconstruct numbers you didn't directly observe in search results. If you cannot provide a sourceUrl for a specific factual claim, either omit the claim or mark the entry with "unverified": true. Bold behavioral analysis and insights are encouraged — the guardrail applies only to specific verifiable facts.
`;

function extractJSON(text: string): string {
  let s = text.trim();
  if (s.startsWith("```")) s = s.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "");
  if (!s.startsWith("{")) {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  }
  return s;
}

async function runAgent<T>(prompt: string, maxTokens = 8000): Promise<T> {
  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    tools: [SEARCH_TOOL as Parameters<typeof client.messages.create>[0]["tools"] extends Array<infer U> ? U : never],
    messages: [{ role: "user", content: prompt }],
  });

  let text = "";
  stream.on("text", (t) => { text += t; });
  await stream.finalMessage();
  return JSON.parse(extractJSON(text)) as T;
}

// ─── Agent 1: Influence Map + Entry Points ────────────────────────────────────

export interface InfluenceAgentResult {
  influenceMap: Array<{
    name: string;
    type: "initiator" | "amplifier";
    platform: string;
    intensityScore: number;
    description: string;
    reach?: string;
    behavioralRole?: string;
    funnelStage?: string[];
    sourceUrl?: string;
    unverified?: boolean;
  }>;
  entryPoints: Array<{
    type: string;
    description: string;
    examples: Array<{
      title: string;
      platform: string;
      url?: string;
      why: string;
      unverified?: boolean;
    }>;
  }>;
  sources: AgentSource[];
  meta: AgentMeta;
}

export async function runInfluenceAgent(archetype: string, description: string): Promise<InfluenceAgentResult> {
  log(`Influence Map agent — started (archetype: ${archetype})`);
  const result = await runAgent<InfluenceAgentResult>(`You are a specialist in influence network mapping and behavioral mechanics. Your job is not just to identify who influences this audience — but to understand HOW and WHY that influence moves their behavior. The core question is: what psychological mechanisms are these people susceptible to, and who/what activates those mechanisms?

ARCHETYPE: ${archetype}
DESCRIPTION: ${description}
${ACCURACY_RULE}
RESEARCH LENS: Think like a behavioral strategist, not a media planner. For each influencer, ask: why does this person move people to act? What psychological door do they open? Do they give permission to start? Reduce perceived risk? Provide identity validation? Normalize failure? Create urgency? Your job is to identify the lever, not just the name.

Search for: specific creators, influencers, and brands with real behavioral influence over this audience. Find evidence of behavior change — not just following, but doing. Search Reddit, YouTube, Instagram, TikTok, podcasts. Look for who people credit when they made a decision, who they quote when justifying behavior, who they cite when recommending to others.

Also research ENTRY POINTS — the specific doors people walk through when first entering this behavior or mindset space. What specific videos, posts, threads, or moments are the "gateway"? Find real examples from the internet. Only include examples you actually found during research — do not invent them.

Return ONLY this JSON object (no prose, start with {):
{
  "influenceMap": [
    {
      "name": string (use only the name you directly confirmed — first name only if unsure of last name),
      "type": "initiator" | "amplifier",
      "platform": string,
      "intensityScore": number (1-100, differentiated — based on behavioral impact, not just reach),
      "description": string (specific, evidence-based, 1-2 sentences on what they do and who follows them),
      "reach": string (e.g. "2.3M YouTube subscribers" — only if you read this number directly in a source, otherwise omit),
      "behavioralRole": string (the psychological mechanism this influence plays),
      "funnelStage": string[] (any combination of: "awareness", "consideration", "conversion", "retention"),
      "sourceUrl": string (the specific URL where you confirmed this person's name, platform, and description — required if available),
      "unverified": boolean (set true if you could not confirm details via a direct source URL — omit or set false otherwise)
    }
  ],
  "entryPoints": [
    {
      "type": string (short label for the on-ramp category),
      "description": string (why this works as an entry point),
      "examples": [
        {
          "title": string (specific title or name of the real piece of content you found),
          "platform": string,
          "url": string (the URL where you found this content — required; if you cannot find a real URL, set unverified: true instead of guessing),
          "why": string (what made this specific piece an effective entry point),
          "unverified": boolean (set true if you could not find a real URL for this example — omit or false otherwise)
        }
      ]
    }
  ],
  "sources": [
    {
      "url": string (if available),
      "platform": string,
      "description": string (what this source is),
      "relevance": string (why it was useful for this research)
    }
  ],
  "meta": {
    "sourcesScanned": number,
    "communitiesFound": number,
    "conversationsSampled": number,
    "uniqueVoices": number,
    "searchCount": number,
    "platforms": string[]
  }
}

Include 8-12 influencers ranked by intensityScore descending. Include 4-6 entry points, each with 3-5 real examples. Include 5-8 key sources. Be specific — real names, real content, real URLs where found.`, 16000);
  log(`Influence Map agent — complete`);
  return result;
}

// ─── Agent 2: Digital Habitat ─────────────────────────────────────────────────

export interface HabitatAgentResult {
  digitalHabitat: Array<{
    platform: string;
    community: string;
    engagementIntensity: number;
    category: "forum" | "video" | "audio" | "social" | "newsletter" | "messaging";
    description: string;
    sourceUrl?: string;
    unverified?: boolean;
  }>;
  rankedSources: Array<{
    name: string;
    platform: string;
    type: "community" | "creator_channel" | "publication" | "academic";
    signalStrength: number;
    audienceRelevance: string;
  }>;
  sources: AgentSource[];
  meta: AgentMeta;
}

export async function runHabitatAgent(archetype: string, description: string): Promise<HabitatAgentResult> {
  log(`Digital Habitat agent — started`);
  const result = await runAgent<HabitatAgentResult>(`You are a specialist in digital community mapping. Research where this audience archetype actually spends time online — specifically where their behavior and beliefs are being shaped, not just where they consume content passively.

ARCHETYPE: ${archetype}
DESCRIPTION: ${description}
${ACCURACY_RULE}
RESEARCH LENS: The question is not just "where do they hang out?" but "where do they go to get permission, validation, information, and motivation to act?" Communities where people post about their decisions, ask for advice, share results, and hold each other accountable are higher value than pure content consumption spaces.

Search for: specific subreddits, Discord servers, Facebook groups, YouTube channels, podcasts, newsletters, TikTok niches, forums. Find membership counts and activity levels where they appear in search results. Look at multiple platforms. Dig into niche communities, not just obvious ones.

Return ONLY this JSON object (no prose, start with {):
{
  "digitalHabitat": [
    {
      "platform": string,
      "community": string (specific name — e.g. "r/pelotoncycle" not just "Reddit"),
      "engagementIntensity": number (1-100, differentiated),
      "category": "forum" | "video" | "audio" | "social" | "newsletter" | "messaging",
      "description": string (what behavioral role this community plays — 1-2 sentences),
      "sourceUrl": string (a URL confirming this community exists and is active — e.g. the community's main page),
      "unverified": boolean (set true if you could not find a direct URL to confirm this community — omit or false otherwise)
    }
  ],
  "rankedSources": [
    {
      "name": string,
      "platform": string,
      "type": "community" | "creator_channel" | "publication" | "academic",
      "signalStrength": number (1-100),
      "audienceRelevance": string (1 sentence on why this source was particularly informative for this specific archetype)
    }
  ],
  "sources": [
    {
      "url": string (if available),
      "platform": string,
      "description": string,
      "relevance": string
    }
  ],
  "meta": {
    "sourcesScanned": number,
    "communitiesFound": number,
    "conversationsSampled": number,
    "uniqueVoices": number,
    "searchCount": number,
    "platforms": string[]
  }
}

Include 10-14 communities in digitalHabitat ranked by engagementIntensity descending. Include 8-12 entries in rankedSources ranked by signalStrength descending. Prioritize specificity — real subreddit names, real channel names.`);
  log(`Digital Habitat agent — complete`);
  return result;
}

// ─── Agent 3: Cultural Discourse ──────────────────────────────────────────────

export interface DiscourseAgentResult {
  culturalDiscourse: Array<{
    topic: string;
    sentiment: "positive" | "negative" | "mixed" | "neutral";
    tension?: string;
    actionSide?: string;
    stuckSide?: string;
    exampleQuote?: string;
    source?: string;
  }>;
  sources: AgentSource[];
  meta: AgentMeta;
}

export async function runDiscourseAgent(archetype: string, description: string): Promise<DiscourseAgentResult> {
  log(`Cultural Discourse agent — started`);
  const result = await runAgent<DiscourseAgentResult>(`You are a specialist in cultural discourse analysis with a behavioral strategy lens. Research what this audience archetype is actually talking about — and more importantly, which conversations move them toward action vs. which ones keep them paralyzed.

ARCHETYPE: ${archetype}
DESCRIPTION: ${description}
${ACCURACY_RULE}
RESEARCH LENS: Every tension in a community has two sides — one that pushes people toward doing the thing, and one that keeps them stuck. Your job is to identify which side of each debate activates behavior change. Find both sides. The discourse that matters is not just what they're talking about, but what narrative wins and what that winning narrative makes people do.

Search Reddit, Twitter/X, forums, comment sections, and blogs for current conversations, debates, anxieties, and obsessions. Find actual threads. Look for recurring tensions, controversies, and the exact language people use when they're on the verge of acting vs. when they retreat.

For exampleQuote: use a real quote you found in search results, or write a composite that authentically represents the community's actual voice patterns. Do NOT attribute composite quotes to a specific real person. If you are quoting a real person, you must have found the quote in a search result.

Return ONLY this JSON object (no prose, start with {):
{
  "culturalDiscourse": [
    {
      "topic": string (the topic or debate),
      "sentiment": "positive" | "negative" | "mixed" | "neutral",
      "tension": string (the underlying tension driving this conversation),
      "actionSide": string (the narrative that pushes people to act),
      "stuckSide": string (the narrative that keeps people stuck),
      "exampleQuote": string (authentic representative quote from this community's actual voice),
      "source": string (e.g. "r/pelotoncycle", "Twitter/X fitness discourse")
    }
  ],
  "sources": [
    {
      "url": string (if available),
      "platform": string,
      "description": string,
      "relevance": string
    }
  ],
  "meta": {
    "sourcesScanned": number,
    "communitiesFound": number,
    "conversationsSampled": number,
    "uniqueVoices": number,
    "searchCount": number,
    "platforms": string[]
  }
}

Include 7-10 discourse items. All fields should be grounded in real discourse patterns you found, not assumptions.`);
  log(`Cultural Discourse agent — complete`);
  return result;
}

// ─── Agent 4: Emotional Drivers + Behavioral Signals ─────────────────────────

export interface EmotionalBehavioralAgentResult {
  emotionalDrivers: Array<{
    emotion: "guilt" | "envy" | "pride" | "fomo" | "belonging" | "competition" | "fear" | "disgust" | "reward" | "scarcity";
    score: number;
    evidence: string;
    mechanism?: string;
    funnelStage?: string[];
  }>;
  behavioralSignals: Array<{
    category: "purchase" | "content" | "subscription" | "brand" | "habit";
    signal: string;
    intensity: "high" | "medium" | "low";
    detail: string;
    trigger?: string;
    funnelStage?: string[];
  }>;
  sources: AgentSource[];
  meta: AgentMeta;
}

export async function runEmotionalBehavioralAgent(archetype: string, description: string): Promise<EmotionalBehavioralAgentResult> {
  log(`Emotional & Behavioral agent — started`);
  const result = await runAgent<EmotionalBehavioralAgentResult>(`You are a specialist in emotional mechanics and behavioral analysis. Your job is not just to measure what emotions are present — but to understand how each emotion functions as a behavioral driver. What does it make people do? What does it prevent them from doing? What activates it?

ARCHETYPE: ${archetype}
DESCRIPTION: ${description}
${ACCURACY_RULE}
RESEARCH LENS: Emotions are not just feelings — they are behavioral levers. Guilt doesn't just exist; it pushes people to prove themselves or freeze in shame depending on framing. FOMO doesn't just create anxiety; it creates urgency that overrides rational hesitation. For each emotion, identify not just its intensity but its behavioral mechanism.

For behavioral signals: every behavior has a trigger. "They watch transformation videos" is a signal. "They watch transformation videos at night when guilt peaks after a sedentary day" is a trigger. Find the trigger.

Any specific statistic, study reference, or data point you cite in evidence or mechanism descriptions must be something you found in a search result. If your analysis is your own interpretation of behavioral patterns (not a cited fact), no source is needed — but do not present invented statistics as research findings.

Search for: emotional language in communities, purchasing patterns, content consumption habits, subscription behaviors, brand affiliations.

Return ONLY this JSON object (no prose, start with {):
{
  "emotionalDrivers": [
    {
      "emotion": "guilt" | "envy" | "pride" | "fomo" | "belonging" | "competition" | "fear" | "disgust" | "reward" | "scarcity",
      "score": number (1-100, use the full range — must vary dramatically, not cluster at 70-80),
      "evidence": string (specific behavioral or linguistic evidence from real discourse),
      "mechanism": string (how this emotion functions as a behavioral driver — what it makes people do or avoid),
      "funnelStage": string[] (any combination of: "awareness", "consideration", "conversion", "retention")
    }
  ],
  "behavioralSignals": [
    {
      "category": "purchase" | "content" | "subscription" | "brand" | "habit",
      "signal": string (short descriptive label),
      "intensity": "high" | "medium" | "low",
      "detail": string (specific, evidence-based detail),
      "trigger": string (what causes this behavior — the specific context, emotional state, or stimulus that activates it),
      "funnelStage": string[] (any combination of: "awareness", "consideration", "conversion", "retention")
    }
  ],
  "sources": [
    {
      "url": string (if available),
      "platform": string,
      "description": string,
      "relevance": string
    }
  ],
  "meta": {
    "sourcesScanned": number,
    "communitiesFound": number,
    "conversationsSampled": number,
    "uniqueVoices": number,
    "searchCount": number,
    "platforms": string[]
  }
}

ALL 10 emotions must be scored. Include 10-14 behavioral signals. Scores must be genuinely varied.`);
  log(`Emotional & Behavioral agent — complete`);
  return result;
}

// ─── Agent 5: Influence Susceptibility ───────────────────────────────────────

export interface SusceptibilityAgentResult {
  influenceSusceptibility: {
    overallScore: number;
    initiatorScore: number;
    channels: Array<{
      channel: "peer" | "creator" | "brand" | "algorithm";
      score: number;
      description: string;
    }>;
  };
  sources: AgentSource[];
  meta: AgentMeta;
}

export async function runSusceptibilityAgent(archetype: string, description: string): Promise<SusceptibilityAgentResult> {
  log(`Influence Susceptibility agent — started`);
  const result = await runAgent<SusceptibilityAgentResult>(`You are a specialist in influence dynamics and social contagion. Research how this archetype is moved — which channels of influence reliably produce behavioral change, and which produce awareness without action.

ARCHETYPE: ${archetype}
DESCRIPTION: ${description}
${ACCURACY_RULE}
RESEARCH LENS: The question is not "what do they see?" but "what moves them?" Peer influence that results in actual behavior change is worth more than brand advertising that results in awareness. Look for evidence of channels that produce action — purchases, sign-ups, behavior change — not just attention. Also look for influence-resistance: where does this audience push back, distrust, or tune out?

Search for: how this audience discovers and acts on recommendations — peer vs. algorithm vs. creator vs. brand. Evidence of early adoption vs. late majority. How they talk about being influenced. Moments where they credit a specific source for a decision.

Return ONLY this JSON object (no prose, start with {):
{
  "influenceSusceptibility": {
    "overallScore": number (1-100, overall openness to behavior change through external influence),
    "initiatorScore": number (0-100, where 100 = trendsetter who moves others, 0 = waits for full social proof),
    "channels": [
      {
        "channel": "peer" | "creator" | "brand" | "algorithm",
        "score": number (1-100, how reliably this channel produces behavioral change — not just awareness),
        "description": string (specific evidence: what this channel makes them do, under what conditions it works, where it fails)
      }
    ]
  },
  "sources": [
    {
      "url": string (if available),
      "platform": string,
      "description": string,
      "relevance": string
    }
  ],
  "meta": {
    "sourcesScanned": number,
    "communitiesFound": number,
    "conversationsSampled": number,
    "uniqueVoices": number,
    "searchCount": number,
    "platforms": string[]
  }
}

All 4 channels must be scored. Ground scores in observed behavioral evidence, not assumptions.`);
  log(`Influence Susceptibility agent — complete`);
  return result;
}

// ─── Agent 6: Cultural Depth Check ───────────────────────────────────────────

export interface CulturalDepthAgentResult {
  culturalDepthCheck: Array<{
    signal: string;
    classification: "surface_trend" | "structural_force";
    rationale: string;
    timeframe?: string;
  }>;
  sources: AgentSource[];
  meta: AgentMeta;
}

export async function runCulturalDepthAgent(archetype: string, description: string): Promise<CulturalDepthAgentResult> {
  log(`Cultural Depth agent — started`);
  const result = await runAgent<CulturalDepthAgentResult>(`You are a specialist in cultural analysis and trend forecasting. Research whether the key behavioral signals around this archetype are fleeting trends or enduring structural forces — because this distinction determines whether brands should build strategy around them or just run tactical campaigns.

ARCHETYPE: ${archetype}
DESCRIPTION: ${description}
${ACCURACY_RULE}
RESEARCH LENS: Surface trends are aesthetically driven, socially contagious, and typically fade within 1-3 years. Structural forces are driven by values, economics, demographics, or technology — they reshape behavior for a decade or more. The test: if the aesthetic disappeared tomorrow, would the behavior persist? If yes, it's structural. If the behavior depends on the aesthetic, it's surface.

Search for: history and trajectory of key behaviors and values in this community, expert cultural commentary, trend forecasting data, what similar past moments looked like and how they resolved.

Any specific statistics or study data cited in rationale must come directly from search results. Your structural analysis and interpretation is your own — that's expected. But do not fabricate numbers or attribute claims to unnamed "studies."

Return ONLY this JSON object (no prose, start with {):
{
  "culturalDepthCheck": [
    {
      "signal": string (the cultural signal or behavior being classified),
      "classification": "surface_trend" | "structural_force",
      "rationale": string (specific evidence-based reasoning — what makes this surface vs. structural, what history supports this),
      "timeframe": string (projected lifespan, e.g. "18-month aesthetic cycle", "decade-long structural shift tied to remote work normalization")
    }
  ],
  "sources": [
    {
      "url": string (if available),
      "platform": string,
      "description": string,
      "relevance": string
    }
  ],
  "meta": {
    "sourcesScanned": number,
    "communitiesFound": number,
    "conversationsSampled": number,
    "uniqueVoices": number,
    "searchCount": number,
    "platforms": string[]
  }
}

Include 6-8 signals. Mix of surface trends and structural forces — don't classify everything the same way.`);
  log(`Cultural Depth agent — complete`);
  return result;
}

// ─── Agent 7: Periphery Influence ────────────────────────────────────────────

export interface PeripheryAgentResult {
  periphery: {
    mindset: Array<{
      name: string;
      overlapStrength: number;
      ring: "inner" | "outer";
      evidence: string;
      topInfluences: Array<{ name: string; platform: string; reach?: string; role?: string; sourceUrl?: string; unverified?: boolean }>;
    }>;
    lifestyle: Array<{
      name: string;
      overlapStrength: number;
      ring: "inner" | "outer";
      evidence: string;
      topInfluences: Array<{ name: string; platform: string; reach?: string; role?: string; sourceUrl?: string; unverified?: boolean }>;
    }>;
    interest: Array<{
      name: string;
      overlapStrength: number;
      ring: "inner" | "outer";
      evidence: string;
      topInfluences: Array<{ name: string; platform: string; reach?: string; role?: string; sourceUrl?: string; unverified?: boolean }>;
    }>;
    entertainment: Array<{
      name: string;
      overlapStrength: number;
      ring: "inner" | "outer";
      evidence: string;
      topInfluences: Array<{ name: string; platform: string; reach?: string; role?: string; sourceUrl?: string; unverified?: boolean }>;
    }>;
  };
  sources: AgentSource[];
  meta: AgentMeta;
}

export async function runPeripheryAgent(
  archetype: string,
  description: string,
  allResearch: AllResearch,
  synthesis: string
): Promise<PeripheryAgentResult> {
  log(`Periphery Influence agent — started`);

  const priorContext = JSON.stringify({
    synthesis,
    topInfluences: allResearch.influence.influenceMap.slice(0, 6).map(i => ({
      name: i.name,
      platform: i.platform,
      behavioralRole: i.behavioralRole,
      description: i.description,
    })),
    topCommunities: allResearch.habitat.digitalHabitat.slice(0, 6).map(h => ({
      community: h.community,
      platform: h.platform,
      description: h.description,
    })),
    discourseTopics: allResearch.discourse.culturalDiscourse.slice(0, 5).map(d => ({
      topic: d.topic,
      actionSide: d.actionSide,
    })),
    topEmotions: allResearch.emotionalBehavioral.emotionalDrivers
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(e => ({ emotion: e.emotion, score: e.score, mechanism: e.mechanism })),
    behavioralSignals: allResearch.emotionalBehavioral.behavioralSignals
      .filter(s => s.intensity === "high")
      .slice(0, 5)
      .map(s => ({ signal: s.signal, trigger: s.trigger })),
    culturalSignals: allResearch.culturalDepth.culturalDepthCheck.slice(0, 4).map(c => ({
      signal: c.signal,
      classification: c.classification,
    })),
  });

  const result = await runAgent<PeripheryAgentResult>(`You are a specialist in audience periphery mapping. Your job is to expand outward from what has already been discovered about this audience — not to re-research the core, but to find the adjacent territories where this audience over-indexes.

ARCHETYPE: ${archetype}
DESCRIPTION: ${description}
${ACCURACY_RULE}
PRIOR RESEARCH CONTEXT (expand FROM this, don't restart):
${priorContext}

CRITICAL INSTRUCTION: Do not re-discover what is already in the context above. Start from those findings and ask: "Given what we now know about who these people are and what moves them — what ELSE are they disproportionately into?"

For example: if the core audience is fitness-focused and the research found they're driven by self-optimization and follow Huberman Lab — the periphery might be: biohacking (mindset), clean eating culture (lifestyle), productivity systems (interest), true crime podcasts (entertainment). Use the actual prior findings to infer what adjacent spaces THIS specific audience likely over-indexes in.

Research four peripheral segments:
- MINDSET: What broader mindset patterns define this group? What philosophical, psychological, or self-improvement domains overlap?
- LIFESTYLE: What lifestyle territories show disproportionate overlap?
- INTEREST: What other interests does this audience over-index on?
- ENTERTAINMENT: What entertainment are they disproportionately into?

For topInfluences: only include people or entities you verified through search. Use first name only if unsure of the last name. Include sourceUrl for each influence where you found it. Set unverified: true if you could not confirm details.

Return ONLY this JSON object (no prose, start with {):
{
  "periphery": {
    "mindset": [
      {
        "name": string (adjacent territory name — short, e.g. "Stoic self-discipline"),
        "overlapStrength": number (50-100: 80+ = inner ring, 50-79 = outer ring),
        "ring": "inner" | "outer",
        "evidence": string (1 sentence connecting this adjacency back to prior research findings),
        "topInfluences": [
          {
            "name": string (specific person, brand, or publication — use only what you confirmed),
            "platform": string,
            "reach": string (brief descriptor only if you read the number directly in a source — otherwise omit),
            "role": string (the behavioral role this influence plays for this audience in this adjacent space),
            "sourceUrl": string (URL where you confirmed this person's relevance — include if found),
            "unverified": boolean (set true if you could not verify via a direct source)
          }
        ]
      }
    ],
    "lifestyle": [ ...same structure... ],
    "interest": [ ...same structure... ],
    "entertainment": [ ...same structure... ]
  },
  "sources": [
    {
      "url": string (if available),
      "platform": string,
      "description": string,
      "relevance": string
    }
  ],
  "meta": {
    "sourcesScanned": number,
    "communitiesFound": number,
    "conversationsSampled": number,
    "uniqueVoices": number,
    "searchCount": number,
    "platforms": string[]
  }
}

Each segment must have 3-4 adjacencies. Inner ring adjacencies should have overlapStrength 80-100. Outer ring should be 50-79. Include 2-3 topInfluences per adjacency. Be specific — real names, real platforms.`, 14000);

  log(`Periphery Influence agent — complete`);
  return result;
}

// ─── Synthesis Agent ──────────────────────────────────────────────────────────

export interface AllResearch {
  influence: InfluenceAgentResult;
  habitat: HabitatAgentResult;
  discourse: DiscourseAgentResult;
  emotionalBehavioral: EmotionalBehavioralAgentResult;
  susceptibility: SusceptibilityAgentResult;
  culturalDepth: CulturalDepthAgentResult;
}

export async function runSynthesisAgent(
  archetype: string,
  description: string,
  research: AllResearch
): Promise<string> {
  log(`Synthesis agent — started`);
  const stream = await client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are synthesizing a multi-agent behavioral intelligence report. Based on ALL of the following research, write a sharp 2-3 sentence summary — not of who this archetype is demographically, but of what moves them. What is the core behavioral truth? What is the lever? What is the psychological state that a brand, message, or product needs to meet them in?

ARCHETYPE: ${archetype}
DESCRIPTION: ${description}

TOP INFLUENCES AND THEIR BEHAVIORAL ROLES: ${JSON.stringify(research.influence.influenceMap.slice(0, 3).map(i => ({ name: i.name, behavioralRole: i.behavioralRole })))}
KEY DISCOURSE TENSIONS (action side): ${JSON.stringify(research.discourse.culturalDiscourse.slice(0, 3).map(d => ({ topic: d.topic, actionSide: d.actionSide })))}
DOMINANT EMOTIONAL MECHANISMS: ${JSON.stringify(research.emotionalBehavioral.emotionalDrivers.sort((a, b) => b.score - a.score).slice(0, 3).map(e => ({ emotion: e.emotion, score: e.score, mechanism: e.mechanism })))}
HIGH-INTENSITY BEHAVIORAL TRIGGERS: ${JSON.stringify(research.emotionalBehavioral.behavioralSignals.filter(s => s.intensity === "high").slice(0, 3).map(s => ({ signal: s.signal, trigger: s.trigger })))}

Return ONLY the summary text. No JSON. No labels. 2-3 sharp sentences that a strategist could act on.`,
      },
    ],
  });

  let summary = "";
  stream.on("text", (t) => { summary += t; });
  await stream.finalMessage();
  log(`Synthesis agent — complete`);
  return summary.trim();
}

// ─── Research Depth Aggregator ────────────────────────────────────────────────

export function aggregateResearchDepth(research: AllResearch, periphery?: PeripheryAgentResult) {
  const allMeta = [
    research.influence.meta,
    research.habitat.meta,
    research.discourse.meta,
    research.emotionalBehavioral.meta,
    research.susceptibility.meta,
    research.culturalDepth.meta,
    ...(periphery ? [periphery.meta] : []),
  ];

  const allPlatforms = new Set<string>();
  allMeta.forEach(m => m.platforms.forEach(p => allPlatforms.add(p)));

  return {
    sourcesScanned: allMeta.reduce((s, m) => s + m.sourcesScanned, 0),
    communitiesAnalyzed: allMeta.reduce((s, m) => s + m.communitiesFound, 0),
    conversationsSampled: allMeta.reduce((s, m) => s + m.conversationsSampled, 0),
    uniqueVoicesDetected: allMeta.reduce((s, m) => s + m.uniqueVoices, 0),
    searchQueriesRun: allMeta.reduce((s, m) => s + m.searchCount, 0),
    platformsCovered: Array.from(allPlatforms),
  };
}

// ─── Source Aggregator ────────────────────────────────────────────────────────

export function aggregateSources(research: AllResearch, periphery?: PeripheryAgentResult) {
  return [
    ...(research.influence.sources ?? []),
    ...(research.habitat.sources ?? []),
    ...(research.discourse.sources ?? []),
    ...(research.emotionalBehavioral.sources ?? []),
    ...(research.susceptibility.sources ?? []),
    ...(research.culturalDepth.sources ?? []),
    ...(periphery?.sources ?? []),
  ];
}
