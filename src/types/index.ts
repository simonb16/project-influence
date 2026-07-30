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

/** Explicit core-vs-base contrast on an item — only present when the lenses
 * found real evidence of a difference. */
export interface CoreVsBaseNote {
  core: string; // what's true of the influential core
  base: string; // what's true of the broader audience
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
  coreVsBase?: CoreVsBaseNote;
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
  coreVsBase?: CoreVsBaseNote;
}

export interface BehavioralSignal {
  category: "purchase" | "content" | "subscription" | "brand" | "habit";
  signal: string;
  intensity: "high" | "medium" | "low";
  detail: string;
  trigger?: string; // what causes this behavior to happen
  funnelStage?: string[]; // "awareness" | "consideration" | "conversion" | "retention"
  convergenceStatus?: ConvergenceStatus;
  coreVsBase?: CoreVsBaseNote;
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
  // Round 4 signal depth (all optional — absent on older reports)
  barriers?: Barrier[];
  findability?: Findability;
  inMarketBehavior?: InMarketBehavior;
  trustedVoices?: TrustedVoice[];
  realWorldHabitat?: RealWorldHabitatItem[];
  signalsSnapshot?: SignalsSnapshot;
  // Round 5: validated platform data from the reconciliation agent's tool calls
  dataSignals?: DataSignalsSynthesis;
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
  culturalConnectors?: CulturalConnector[]; // Round 5 — absent on older reports
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

// ─── Round 4: Signal depth types ─────────────────────────────────────────────

export interface Barrier {
  name: string;
  type: "practical" | "psychological" | "social" | "trust";
  description: string;
  evidence: string;
  intensity: number; // 0-100
  implication: string; // what would lower this barrier — evidence-based, not a campaign idea
}

export interface Findability {
  targetableInterests: string[];
  searchBehaviors: string[];
  platformConcentrations: Array<{ platform: string; spaces: string[]; note: string }>;
  affinityAdjacencies: Array<{ interest: string; rationale: string }>;
}

export interface InMarketBehavior {
  researchPattern: string;
  comparisonBehavior: string;
  decisionTriggers: string[];
  postPurchaseBehavior: string;
  coreVsBase?: CoreVsBaseNote;
}

export interface TrustedVoice {
  voice: string; // archetype, or a named example only when lens evidence specifically supports it
  whyTrusted: string;
  proofFormats: string[];
  trustWeight: number; // 0-100
  fragility: string; // what would break this trust
}

export interface RealWorldHabitatItem {
  context: string; // the place/setting
  influenceType: "discovery" | "recommendation" | "demonstration" | "validation" | "gathering";
  description: string;
  evidence: string;
  strength: number; // 0-100
}

export interface SnapshotEntry {
  label: string;
  detail?: string; // the one-step-deeper specific
  score?: number;
  rating?: string; // e.g. "HIGH" where the source uses ratings
}

export interface SignalsSnapshot {
  coreLabel: string; // must match the archetype name in the influential core description
  motivational: SnapshotEntry[];
  behavioral: SnapshotEntry[];
  trust: SnapshotEntry[];
  social: SnapshotEntry[];
}

// ─── Round 5: Data signals (reconciliation tool-use) + cultural connectors ───

export interface DataSignal {
  source: "google_trends" | "reddit" | "youtube" | "pinterest";
  signalType: "motivational" | "behavioral" | "trust" | "social";
  metric: string; // headline number: "+103% YoY", "452K subscribers"
  subject: string; // what it's about: "'craft night' searches", "r/knitting"
  finding: string; // what the data showed (1 sentence)
  significance: string; // why it matters (2-3 sentences, WITH comparisons/context)
  validates: string; // which lens claim or report item this confirms/challenges
}

export interface DataSignalsSynthesis {
  signals: DataSignal[]; // 3-6, ordered by strategic importance
  collectiveFinding: string; // 3-5 sentence synthesis — what the data collectively reveals
  dataSources: string[]; // APIs successfully queried
  unavailableSources: string[]; // APIs not configured or failed
}

export interface CulturalConnector {
  connector: string; // the archetype, space, format, or moment
  type: "voice" | "space" | "format" | "moment";
  bridges: string; // what it connects — "from → to"
  mechanism: string; // how influence travels across this bridge
  evidence: string;
  bridgeStrength: number; // 0-100
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
