// ─── Three-lens metadata (Round 1) ───────────────────────────────────────────

export type ConvergenceStatus = "converged" | "conflicted" | "single-lens";
export type ConfidenceLevel = "high" | "medium" | "directional" | "flagged";

export interface SignalScores {
  composite: number; // 1-10
  credibility: number;
  copyability: number;
  participationQuality: number;
  transmissionPower: number;
  bridgePotential: number;
  desireCreation: number;
}

export interface InfluentialCore {
  definition: string;
  profile: string;
  keyBehaviors: string[];
  keyTensions: string[];
  languageCodes: string[];
  trustSignals: string[];
  activationRecommendations: string[];
}

export type ReachLevel = "mainstream" | "significant" | "niche" | "micro";

export interface Influencer {
  name: string;
  type: "initiator" | "amplifier";
  platform: string;
  intensityScore: number; // 1-100
  description: string;
  reach?: string;
  reachLevel?: ReachLevel; // categorical reach — X-axis of the influence quadrant
  behavioralRole?: string; // psychological mechanism this influence plays
  funnelStage?: string[]; // "awareness" | "consideration" | "conversion" | "retention"
  sourceUrl?: string; // URL where this influencer's details were confirmed
  unverified?: boolean; // true when specific details could not be source-confirmed
  scores?: SignalScores; // 6-dimension influence scores from the reconciliation agent
  convergenceStatus?: ConvergenceStatus; // did multiple lenses find this independently
  conflictNotes?: string; // if conflicted, what the lenses disagreed about
  confidence?: ConfidenceLevel;
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
  convergenceStatus?: ConvergenceStatus;
}

export interface DiscourseItem {
  topic: string;
  sentiment: "positive" | "negative" | "mixed" | "neutral";
  tension?: string;
  actionSide?: string; // which side of the tension moves people to act
  stuckSide?: string;  // which side keeps them stuck
  exampleQuote?: string;
  source?: string;
  direction?: "accelerating" | "emerging" | "stable" | "fading";
  convergenceStatus?: ConvergenceStatus;
}

export interface EmotionalDriver {
  emotion: "guilt" | "envy" | "pride" | "fomo" | "belonging" | "competition" | "fear" | "disgust" | "reward" | "scarcity";
  score: number; // 1-100
  evidence: string;
  mechanism?: string; // how this emotion functions to drive behavior
  funnelStage?: string[]; // "awareness" | "consideration" | "conversion" | "retention"
  convergenceStatus?: ConvergenceStatus;
}

export interface BehavioralSignal {
  category: "purchase" | "content" | "subscription" | "brand" | "habit";
  signal: string;
  intensity: "high" | "medium" | "low";
  detail: string;
  trigger?: string; // what causes this behavior to happen
  funnelStage?: string[]; // "awareness" | "consideration" | "conversion" | "retention"
  convergenceStatus?: ConvergenceStatus;
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
  rationale?: string; // which scored signals support this recommendation
  approach?: string; // what a brand should do here — tone, format, content type
  avoid?: string; // what NOT to do here
  confidence?: ConfidenceLevel;
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
  // Legacy metrics (pre-three-lens reports; kept optional for saved reports)
  sourcesScanned?: number;
  communitiesAnalyzed?: number;
  conversationsSampled?: number;
  uniqueVoicesDetected?: number;
  searchQueriesRun?: number;
  platformsCovered?: string[];
  // Three-lens metrics (Round 1+)
  totalSignalsScored?: number;
  highConfidenceFindings?: number;
  convergedFindings?: number;
  conflictedFindings?: number;
  singleLensFindings?: number;
  lensesUsed?: string[];
  averageCompositeScore?: number;
}

export interface ArchetypeReport {
  archetype: string; // short display title (derived from audience for new reports)
  query?: string; // legacy: original user-entered description (pre-Round 2 reports)
  audience?: string; // Round 2+: full audience description from the input form
  brand?: string; // Round 2+: optional brand input
  context?: string; // Round 2+: optional strategic context input
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
    highSusceptibility?: string[]; // types of influence they're most open to
    lowSusceptibility?: string[]; // types of influence they resist or reject
    trustTransferPaths?: string[]; // how trust moves, e.g. "peer rec > expert endorsement > brand claim"
  };
  culturalDepthCheck: CulturalSignal[];
  sources?: AgentSource[]; // aggregated sources from all agents
  rankedSources?: RankedSource[]; // top communities ranked by signal strength
  periphery?: LegacyPeripheryData; // legacy periphery shape (pre-Round 2 saved reports)
  peripheryData?: PeripheryData; // Round 2+: dedicated Periphery agent output
  influentialCore?: InfluentialCore; // three-lens synthesis: who the influential core is
}

// ─── Periphery types (Round 2 Periphery agent) ───────────────────────────────

export type PeripherySegment = "mindset" | "lifestyle" | "interest" | "entertainment";
export type OverlapStrength = "near-universal" | "strong" | "moderate" | "emerging";

export interface PeripheryItem {
  name: string;
  segment: PeripherySegment;
  overlapStrength: OverlapStrength;
  description: string;
  evidence: string;
}

export interface PeripheryInsights {
  surprisingOverlaps: string[];
  bridgeOpportunities: string[];
  expansionPaths: Array<{
    direction: string;
    rationale: string;
    risk: string;
  }>;
}

export interface PeripheryData {
  peripheryMap: {
    innerRing: PeripheryItem[];
    outerRing: PeripheryItem[];
  };
  insights: PeripheryInsights;
}

// ─── Legacy periphery types (pre-Round 2 saved reports) ─────────────────────

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

export interface LegacyPeripheryData {
  mindset: Adjacency[];
  lifestyle: Adjacency[];
  interest: Adjacency[];
  entertainment: Adjacency[];
}

export interface AnalyzeRequest {
  audience: string;
  brand?: string;
  context?: string;
}

export interface StreamChunk {
  type: "progress" | "report" | "error" | "heartbeat";
  message?: string;
  report?: ArchetypeReport;
  error?: string;
}
