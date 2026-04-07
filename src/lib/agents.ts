import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

async function runAgent<T>(prompt: string): Promise<T> {
  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    tools: [SEARCH_TOOL as Parameters<typeof client.messages.create>[0]["tools"] extends Array<infer U> ? U : never],
    messages: [{ role: "user", content: prompt }],
  });

  let text = "";
  stream.on("text", (t) => { text += t; });
  await stream.finalMessage();
  return JSON.parse(extractJSON(text)) as T;
}

// ─── Agent 1: Influence Map ───────────────────────────────────────────────────

export interface InfluenceAgentResult {
  influenceMap: Array<{
    name: string;
    type: "initiator" | "amplifier";
    platform: string;
    intensityScore: number;
    description: string;
    reach?: string;
  }>;
  meta: AgentMeta;
}

export async function runInfluenceAgent(archetype: string, description: string): Promise<InfluenceAgentResult> {
  return runAgent<InfluenceAgentResult>(`You are a specialist in influence network mapping. Research the influence ecosystem for this audience archetype.

ARCHETYPE: ${archetype}
DESCRIPTION: ${description}

Search for: specific creators, influencers, and brands that have outsized sway over this audience. Find their subscriber counts, engagement rates, content style. Search Reddit, YouTube, Instagram, TikTok, podcasts. Identify who are the initiators (5% who set trends) vs amplifiers (those who spread them).

Return ONLY this JSON object (no prose, start with {):
{
  "influenceMap": [
    {
      "name": string,
      "type": "initiator" | "amplifier",
      "platform": string,
      "intensityScore": number (1-100, differentiated scores),
      "description": string (specific, evidence-based, 1-2 sentences),
      "reach": string (e.g. "2.3M YouTube subscribers")
    }
  ],
  "meta": {
    "sourcesScanned": number (distinct URLs/pages read),
    "communitiesFound": number (distinct communities encountered),
    "conversationsSampled": number (threads/posts examined),
    "uniqueVoices": number (distinct named individuals found),
    "searchCount": number (searches performed),
    "platforms": string[] (platforms searched)
  }
}

Include 8-12 influencers ranked by intensityScore descending. Be specific — real names, real platforms, real reach numbers.`);
}

// ─── Agent 2: Digital Habitat ─────────────────────────────────────────────────

export interface HabitatAgentResult {
  digitalHabitat: Array<{
    platform: string;
    community: string;
    engagementIntensity: number;
    category: "forum" | "video" | "audio" | "social" | "newsletter" | "messaging";
    description: string;
  }>;
  meta: AgentMeta;
}

export async function runHabitatAgent(archetype: string, description: string): Promise<HabitatAgentResult> {
  return runAgent<HabitatAgentResult>(`You are a specialist in digital community mapping. Research where this audience archetype actually spends time online.

ARCHETYPE: ${archetype}
DESCRIPTION: ${description}

Search for: specific subreddits, Discord servers, Facebook groups, YouTube channels, podcasts, newsletters, TikTok niches, forums. Find membership counts and activity levels. Look at multiple platforms. Dig into niche communities, not just obvious ones.

Return ONLY this JSON object (no prose, start with {):
{
  "digitalHabitat": [
    {
      "platform": string,
      "community": string (specific name — e.g. "r/pelotoncycle" not just "Reddit"),
      "engagementIntensity": number (1-100, differentiated),
      "category": "forum" | "video" | "audio" | "social" | "newsletter" | "messaging",
      "description": string (what they do/discuss there, 1-2 sentences)
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

Include 10-14 communities ranked by engagementIntensity descending. Prioritize specificity — real subreddit names, real channel names.`);
}

// ─── Agent 3: Cultural Discourse ──────────────────────────────────────────────

export interface DiscourseAgentResult {
  culturalDiscourse: Array<{
    topic: string;
    sentiment: "positive" | "negative" | "mixed" | "neutral";
    tension?: string;
    exampleQuote?: string;
    source?: string;
  }>;
  meta: AgentMeta;
}

export async function runDiscourseAgent(archetype: string, description: string): Promise<DiscourseAgentResult> {
  return runAgent<DiscourseAgentResult>(`You are a specialist in cultural discourse analysis. Research what this audience archetype is actually talking about right now.

ARCHETYPE: ${archetype}
DESCRIPTION: ${description}

Search Reddit, Twitter/X, forums, comment sections, and blogs for current conversations, debates, anxieties, and obsessions within this community. Find actual threads with real sentiment. Look for recurring tensions, controversies, and cultural flash points. Capture authentic voice.

Return ONLY this JSON object (no prose, start with {):
{
  "culturalDiscourse": [
    {
      "topic": string (the topic or debate),
      "sentiment": "positive" | "negative" | "mixed" | "neutral",
      "tension": string (the underlying tension or anxiety driving this),
      "exampleQuote": string (authentic-sounding representative quote from this community's actual voice),
      "source": string (e.g. "r/pelotoncycle", "Twitter/X fitness discourse")
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

Include 7-10 discourse items. Quotes should sound like something a real person in this community would say, not marketing copy.`);
}

// ─── Agent 4: Emotional Drivers + Behavioral Signals ─────────────────────────

export interface EmotionalBehavioralAgentResult {
  emotionalDrivers: Array<{
    emotion: "guilt" | "envy" | "pride" | "fomo" | "belonging" | "competition" | "fear" | "disgust" | "reward" | "scarcity";
    score: number;
    evidence: string;
  }>;
  behavioralSignals: Array<{
    category: "purchase" | "content" | "subscription" | "brand" | "habit";
    signal: string;
    intensity: "high" | "medium" | "low";
    detail: string;
  }>;
  meta: AgentMeta;
}

export async function runEmotionalBehavioralAgent(archetype: string, description: string): Promise<EmotionalBehavioralAgentResult> {
  return runAgent<EmotionalBehavioralAgentResult>(`You are a specialist in emotional and behavioral analysis. Research the emotional language patterns and real behaviors of this audience archetype.

ARCHETYPE: ${archetype}
DESCRIPTION: ${description}

Search for: emotional language in their communities (guilt, envy, pride, FOMO, belonging, competition, fear, disgust, reward, scarcity). Find their actual purchasing patterns, content habits, subscription behaviors, brand affiliations. Look at what they buy, watch, listen to, and talk about doing. Find real data on spending habits, brand preferences, content consumption.

Return ONLY this JSON object (no prose, start with {):
{
  "emotionalDrivers": [
    {
      "emotion": "guilt" | "envy" | "pride" | "fomo" | "belonging" | "competition" | "fear" | "disgust" | "reward" | "scarcity",
      "score": number (1-100, use full range — scores should vary dramatically, not cluster at 70-80),
      "evidence": string (specific behavioral or linguistic evidence for this score, 1-2 sentences)
    }
  ],
  "behavioralSignals": [
    {
      "category": "purchase" | "content" | "subscription" | "brand" | "habit",
      "signal": string (short descriptive label),
      "intensity": "high" | "medium" | "low",
      "detail": string (specific, evidence-based detail)
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

ALL 10 emotions must be scored. Include 10-14 behavioral signals. Scores must be genuinely varied (some in 20s, some in 80s+).`);
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
  meta: AgentMeta;
}

export async function runSusceptibilityAgent(archetype: string, description: string): Promise<SusceptibilityAgentResult> {
  return runAgent<SusceptibilityAgentResult>(`You are a specialist in influence dynamics and social contagion. Research how susceptible this archetype is to different types of influence.

ARCHETYPE: ${archetype}
DESCRIPTION: ${description}

Search for: how this audience discovers products (peer recommendation vs. algorithm vs. creator vs. brand advertising), their relationship to trends (do they set them or follow them), evidence of early adoption vs. late majority behavior, how they talk about being influenced, word-of-mouth patterns, and brand loyalty signals.

Return ONLY this JSON object (no prose, start with {):
{
  "influenceSusceptibility": {
    "overallScore": number (1-100, overall susceptibility to outside influence),
    "initiatorScore": number (0-100, where 100 = pure trendsetter/initiator, 0 = pure follower/imitator),
    "channels": [
      {
        "channel": "peer" | "creator" | "brand" | "algorithm",
        "score": number (1-100, how much this channel influences them),
        "description": string (specific evidence for this score)
      }
    ]
  },
  "meta": {
    "sourcesScanned": number,
    "communitiesFound": number,
    "conversationsSampled": number,
    "uniqueVoices": number,
    "searchCount": number,
    "platforms": string[]
  }
}

All 4 channels must be scored. Scores should reflect real behavioral evidence, not assumptions.`);
}

// ─── Agent 6: Cultural Depth Check ───────────────────────────────────────────

export interface CulturalDepthAgentResult {
  culturalDepthCheck: Array<{
    signal: string;
    classification: "surface_trend" | "structural_force";
    rationale: string;
    timeframe?: string;
  }>;
  meta: AgentMeta;
}

export async function runCulturalDepthAgent(archetype: string, description: string): Promise<CulturalDepthAgentResult> {
  return runAgent<CulturalDepthAgentResult>(`You are a specialist in cultural analysis and trend forecasting. Research whether the key signals around this archetype are fleeting trends or enduring structural forces.

ARCHETYPE: ${archetype}
DESCRIPTION: ${description}

Search for: the history and trajectory of key behaviors and values in this community — how long have they existed, what drives them (aesthetics vs. deep values), what similar past trends looked like, expert cultural commentary, trend forecasting data. Distinguish between what's genuinely changing society vs. what's a passing moment.

Return ONLY this JSON object (no prose, start with {):
{
  "culturalDepthCheck": [
    {
      "signal": string (the cultural signal or behavior being classified),
      "classification": "surface_trend" | "structural_force",
      "rationale": string (specific evidence-based reasoning for the classification),
      "timeframe": string (e.g. "18-month aesthetic cycle", "decade-long structural shift")
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
  const stream = await client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are synthesizing a multi-agent intelligence report. Based on ALL of the following research, write a sharp 2-3 sentence summary of who this archetype really is — beyond demographics, capturing their cultural reality, dominant emotional state, and key behavioral truth.

ARCHETYPE: ${archetype}
DESCRIPTION: ${description}

INFLUENCE MAP FINDINGS: ${JSON.stringify(research.influence.influenceMap.slice(0, 3))}
CULTURAL DISCOURSE: ${JSON.stringify(research.discourse.culturalDiscourse.slice(0, 3))}
TOP EMOTIONAL DRIVERS: ${JSON.stringify(research.emotionalBehavioral.emotionalDrivers.sort((a, b) => b.score - a.score).slice(0, 3))}
BEHAVIORAL SIGNALS: ${JSON.stringify(research.emotionalBehavioral.behavioralSignals.filter(s => s.intensity === "high").slice(0, 3))}

Return ONLY the summary text. No JSON. No labels. Just 2-3 sharp sentences.`,
      },
    ],
  });

  let summary = "";
  stream.on("text", (t) => { summary += t; });
  await stream.finalMessage();
  return summary.trim();
}

// ─── Research Depth Aggregator ────────────────────────────────────────────────

export function aggregateResearchDepth(research: AllResearch) {
  const allMeta = [
    research.influence.meta,
    research.habitat.meta,
    research.discourse.meta,
    research.emotionalBehavioral.meta,
    research.susceptibility.meta,
    research.culturalDepth.meta,
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
