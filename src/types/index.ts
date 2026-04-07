export interface Influencer {
  name: string;
  type: "initiator" | "amplifier";
  platform: string;
  intensityScore: number; // 1-100
  description: string;
  reach?: string;
}

export interface DigitalHabitat {
  platform: string;
  community: string;
  url?: string;
  engagementIntensity: number; // 1-100
  category: "forum" | "video" | "audio" | "social" | "newsletter" | "messaging";
  description: string;
}

export interface DiscourseItem {
  topic: string;
  sentiment: "positive" | "negative" | "mixed" | "neutral";
  tension?: string;
  exampleQuote?: string;
  source?: string;
}

export interface EmotionalDriver {
  emotion: "guilt" | "envy" | "pride" | "fomo" | "belonging" | "competition" | "fear" | "disgust" | "reward" | "scarcity";
  score: number; // 1-100
  evidence: string;
}

export interface BehavioralSignal {
  category: "purchase" | "content" | "subscription" | "brand" | "habit";
  signal: string;
  intensity: "high" | "medium" | "low";
  detail: string;
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
  summary: string;
  generatedAt: string;
  researchDepth: ResearchDepth;
  influenceMap: Influencer[];
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
}

export interface AnalyzeRequest {
  archetype: string;
  description: string;
}

export interface StreamChunk {
  type: "progress" | "report" | "error";
  message?: string;
  report?: ArchetypeReport;
  error?: string;
}
