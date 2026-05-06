export interface Influencer {
  name: string;
  type: "initiator" | "amplifier";
  platform: string;
  intensityScore: number; // 1-100
  description: string;
  reach?: string;
  behavioralRole?: string; // psychological mechanism this influence plays
  funnelStage?: string[]; // "awareness" | "consideration" | "conversion" | "retention"
  sourceUrl?: string; // URL where this influencer's details were confirmed
  unverified?: boolean; // true when specific details could not be source-confirmed
}

export interface DigitalHabitat {
  platform: string;
  community: string;
  url?: string;
  engagementIntensity: number; // 1-100
  category: "forum" | "video" | "audio" | "social" | "newsletter" | "messaging";
  description: string;
  sourceUrl?: string; // URL confirming this community's existence and relevance
  unverified?: boolean;
}

export interface DiscourseItem {
  topic: string;
  sentiment: "positive" | "negative" | "mixed" | "neutral";
  tension?: string;
  actionSide?: string; // which side of the tension moves people to act
  stuckSide?: string;  // which side keeps them stuck
  exampleQuote?: string;
  source?: string;
}

export interface EmotionalDriver {
  emotion: "guilt" | "envy" | "pride" | "fomo" | "belonging" | "competition" | "fear" | "disgust" | "reward" | "scarcity";
  score: number; // 1-100
  evidence: string;
  mechanism?: string; // how this emotion functions to drive behavior
  funnelStage?: string[]; // "awareness" | "consideration" | "conversion" | "retention"
}

export interface BehavioralSignal {
  category: "purchase" | "content" | "subscription" | "brand" | "habit";
  signal: string;
  intensity: "high" | "medium" | "low";
  detail: string;
  trigger?: string; // what causes this behavior to happen
  funnelStage?: string[]; // "awareness" | "consideration" | "conversion" | "retention"
}

export interface InfluenceChannel {
  channel: "peer" | "creator" | "brand" | "algorithm";
  score: number; // 1-100
  description: string;
}

export interface CulturalSignal {
  signal: string;
  classification: "surface_trend" | "structural_force";
  rationale: string;
  timeframe?: string;
}

export interface EntryPointExample {
  title: string;
  platform: string;
  url?: string; // the URL where this content was found (serves as sourceUrl)
  why: string; // what made this specific piece an effective entry point
  unverified?: boolean; // true when this example could not be confirmed via a real URL
}

export interface EntryPoint {
  type: string; // short label for the on-ramp category
  description: string; // why this works as an entry point
  examples: EntryPointExample[];
}

export interface RankedSource {
  name: string;
  platform: string;
  type: "community" | "creator_channel" | "publication" | "academic";
  signalStrength: number; // 1-100
  audienceRelevance: string;
}

export interface AgentSource {
  url?: string;
  platform: string;
  description: string;
  relevance: string; // why this source was useful
}

export interface ResearchDepth {
  sourcesScanned: number;
  communitiesAnalyzed: number;
  conversationsSampled: number;
  uniqueVoicesDetected: number;
  searchQueriesRun: number;
  platformsCovered: string[];
}

export interface ArchetypeReport {
  archetype: string;
  query?: string; // original user-entered description
  summary: string;
  generatedAt: string;
  researchDepth: ResearchDepth;
  influenceMap: Influencer[];
  entryPoints?: EntryPoint[];
  digitalHabitat: DigitalHabitat[];
  culturalDiscourse: DiscourseItem[];
  emotionalDrivers: EmotionalDriver[];
  behavioralSignals: BehavioralSignal[];
  influenceSusceptibility: {
    overallScore: number;
    initiatorScore: number; // 0-100, 100 = pure initiator
    channels: InfluenceChannel[];
  };
  culturalDepthCheck: CulturalSignal[];
  sources?: AgentSource[]; // aggregated sources from all agents
  rankedSources?: RankedSource[]; // top communities ranked by signal strength
  periphery?: PeripheryData;
}

// ─── Periphery types ─────────────────────────────────────────────────────────

export interface PeripheryInfluence {
  name: string;
  platform: string;
  reach?: string;
  role?: string;
  sourceUrl?: string; // URL confirming this influence's relevance to the adjacent space
  unverified?: boolean;
}

export interface Adjacency {
  name: string;
  overlapStrength: number; // 50-100
  ring: "inner" | "outer"; // inner = 80-100%, outer = 50-80%
  evidence: string;
  topInfluences?: PeripheryInfluence[];
}

export interface PeripheryData {
  mindset: Adjacency[];
  lifestyle: Adjacency[];
  interest: Adjacency[];
  entertainment: Adjacency[];
}

export interface AnalyzeRequest {
  archetype: string;
  description: string;
}

export interface StreamChunk {
  type: "progress" | "report" | "error" | "heartbeat";
  message?: string;
  report?: ArchetypeReport;
  error?: string;
}
