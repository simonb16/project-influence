# SWAY Round 1: Three-Lens Agent Restructure
## Claude Code Brief

---

## What This Round Does

This round replaces Sway's current function-based agent architecture (separate agents for influence map, emotional drivers, behavioral signals, etc.) with a **three-lens architecture** where three independent agents research the same audience from different angles, then a reconciliation agent forces their findings to converge, and a synthesis agent produces the final report.

**Why:** The current architecture has each agent researching one *topic* (emotions, behaviors, digital spaces). The new architecture has each agent researching from one *perspective* (the audience, the brand, the market context). When three independent perspectives arrive at the same finding, it has structural credibility. When they disagree, the disagreement itself is insight. This directly addresses the confabulation concern — it's much harder to fabricate a coherent finding across three independent research paths.

**What changes:** The agents, the prompts, and the batching. The SSE streaming, the input form, the report UI sections, localStorage, and general app structure stay the same for now. We're testing whether the new agent architecture produces better research before we restructure the UI around it.

---

## Important: Read the Design White Paper

This brief implements Phase 1, Round 1 of the SWAY Design White Paper. The full architecture, scoring model, and rationale are documented there. If you need deeper context on *why* things are structured this way, reference the white paper. This brief focuses on *what to build*.

---

## Current State → Target State

### Current (what exists now):
- 7 agents in 4 batches (2-2-2-1)
- Each agent researches a different topic (influence map, digital habitat, cultural discourse, emotional drivers, behavioral signals, cultural depth, periphery)
- Synthesis agent combines all findings
- All agents use Sonnet 4.6 except synthesis (Opus 4.6)

### Target (what this round builds):
- 5 agents in 3 batches (3-1-1)
- Batch 1: Three lens agents research independently from different perspectives
- Batch 2: Reconciliation agent forces findings to meet, tags and scores signals
- Batch 3: Synthesis agent produces the final report
- Lens agents use Sonnet 4.6, Reconciliation and Synthesis use Fable 5

---

## Agent Definitions

### Update `src/lib/agents.ts`

Replace the current agent definitions with these 5 agents. Update the batch configuration from 4 batches to 3 batches.

**Batch 1 — Three Lenses (run in parallel):**

```
Agent 1: Audience Lens
- id: "audience-lens"
- name: "Audience Lens"  
- model: claude-sonnet-4-6
- max searches: 15
- receives: user inputs (archetype name + description from the current form)

Agent 2: Brand Lens
- id: "brand-lens"
- name: "Brand Lens"
- model: claude-sonnet-4-6
- max searches: 15
- receives: user inputs

Agent 3: Context Lens
- id: "context-lens"
- name: "Context Lens"
- model: claude-sonnet-4-6
- max searches: 15
- receives: user inputs
```

**Batch 2 — Reconciliation (runs after all three lenses complete):**

```
Agent 4: Reconciliation
- id: "reconciliation"
- name: "Reconciliation & Scoring"
- model: claude-fable-5
- max searches: 0 (analysis only, no web search tool)
- receives: user inputs + all three lens outputs
```

**Batch 3 — Synthesis (runs after reconciliation):**

```
Agent 5: Synthesis
- id: "synthesis"
- name: "Synthesis"
- model: claude-fable-5
- max searches: 0 (synthesis only, no web search tool)
- receives: user inputs + reconciled/scored dataset from Agent 4
```

### Batching

Update the batch execution in `agents.ts` to run 3 batches:
- Batch 1: `["audience-lens", "brand-lens", "context-lens"]` — all three run in parallel
- Batch 2: `["reconciliation"]` — waits for all of Batch 1, runs solo
- Batch 3: `["synthesis"]` — waits for Batch 2, runs solo

---

## Prompts

### Update `src/lib/prompt.ts`

Replace all current agent prompt templates with the five new ones below. Each prompt is a template function that accepts the user input and (where applicable) prior agent outputs.

### Audience Lens Prompt

```
You are the Audience Lens — one of three independent research agents analyzing an audience. Your job is to approach this research entirely from the audience's perspective. Two other agents are simultaneously researching from the brand perspective and the market context perspective. You will not see their work, and they will not see yours. Your findings will be reconciled with theirs afterward.

AUDIENCE TO RESEARCH:
Name: {archetypeName}
Description: {archetypeDescription}

YOUR MISSION:
Research this audience to answer: Who is the influential core within this audience, and what moves them?

The "influential core" is the most socially active part of this audience — the people whose behaviors, opinions, and choices are visibly copied, discussed, and trusted by others. Most of the audience are tourists who pass through casually. The influential core are rooted. When they adopt something, others follow. When they reject something, it stalls.

RESEARCH STRATEGY (use up to 15 web searches):
1. Find communities where this audience gathers — subreddits, forums, Facebook groups, Discord servers, niche platforms, comment sections
2. Read actual conversations BY the audience, not articles ABOUT them
3. Identify recurring voices and trusted recommenders — people others defer to, cite, or ask for advice
4. Map language patterns — what words signal belonging, what tone indicates trust, what framing gets engagement
5. Look for behavioral proof — what choices are people making visible? What are others copying?
6. Identify emotional drivers — what they care about, fear, aspire to, resent
7. Find tensions — where the audience is conflicted, frustrated, or seeking resolution
8. Look for trust signals — what makes something credible to this audience, what endorsement carries weight

OUTPUT FORMAT (respond in valid JSON):
{
  "lens": "audience",
  "influentialCore": {
    "description": "2-3 paragraph description of who the influential core is for this audience",
    "distinguishingBehaviors": ["list of behaviors that separate the influential core from the broader audience"],
    "estimatedProportion": "rough sense of how large the core is relative to the total audience"
  },
  "communities": [
    {
      "name": "community/space name",
      "platform": "where it exists",
      "description": "what happens here, why it matters",
      "influenceDensity": "high/medium/low — how concentrated is influence here",
      "evidence": "what you found that supports this",
      "sourceUrl": "URL if available"
    }
  ],
  "trustedVoices": [
    {
      "type": "the type of voice (e.g., 'experienced practitioner', 'community moderator', 'micro-creator')",
      "description": "who they are and why they're trusted",
      "behavioralRole": "the psychological mechanism through which they influence (e.g., 'permission to begin', 'identity validation')",
      "evidence": "what you found",
      "sourceUrl": "URL if available"
    }
  ],
  "emotionalDrivers": [
    {
      "driver": "the emotion or motivation",
      "mechanism": "how this emotion drives behavior in the audience",
      "evidence": "what you found",
      "sourceUrl": "URL if available"
    }
  ],
  "behavioralSignals": [
    {
      "behavior": "what they do",
      "visibility": "how visible is this behavior to others",
      "copyability": "how easily can others imitate this",
      "evidence": "what you found",
      "sourceUrl": "URL if available"
    }
  ],
  "languageCodes": [
    {
      "code": "specific word, phrase, or tone pattern",
      "meaning": "what it signals — belonging, expertise, aspiration, etc.",
      "context": "where this language is used",
      "sourceUrl": "URL if available"
    }
  ],
  "tensions": [
    {
      "tension": "the conflict or friction point",
      "sides": "what the opposing forces are",
      "opportunity": "why this tension creates an opening",
      "evidence": "what you found",
      "sourceUrl": "URL if available"
    }
  ],
  "trustArchitecture": {
    "whatMakesThingsCredible": "description of what this audience considers trustworthy",
    "whatDestroysCredibility": "description of what makes this audience skeptical",
    "proofFormats": ["types of proof they respond to — e.g., before/after, data, personal testimony"]
  }
}

CRITICAL RULES:
- NEVER fabricate specific facts. No made-up follower counts, names, statistics, or data points.
- NEVER guess proper nouns. If you're not certain of a name, don't include it.
- Every factual claim must include a sourceUrl where possible. If no source exists, omit the claim.
- Prefer omission to invention. Gaps are fine. Fabrication is not.
- Distinguish observation from inference. If you're drawing a conclusion, say so. Don't present inference as found fact.
- Read actual community conversations. Don't just read articles about the audience — read what the audience actually says.
```

### Brand Lens Prompt

```
You are the Brand Lens — one of three independent research agents analyzing an audience. Your job is to approach this research from the perspective of how brands and commercial forces interact with this audience. Two other agents are simultaneously researching from the audience's internal perspective and the broader market context. You will not see their work, and they will not see yours. Your findings will be reconciled with theirs afterward.

AUDIENCE TO RESEARCH:
Name: {archetypeName}
Description: {archetypeDescription}

YOUR MISSION:
Research how brands, products, and commercial forces currently operate within this audience's influence landscape. Who has credibility? Who doesn't? Where is there white space? What does this audience reward and punish from brands?

RESEARCH STRATEGY (use up to 15 web searches):
1. Find how this audience talks about brands and products in their space — reviews, recommendations, complaints, comparisons
2. Identify which brands have genuine cultural credibility with this audience (not just awareness — actual trust and influence)
3. Look for what makes a brand credible vs. rejected by this audience — what's the difference between brands they embrace and brands they ignore or mock?
4. Find competitive dynamics — which brands compete for this audience's attention and trust, and how do they differentiate?
5. Look for white space — areas where no brand has established cultural credibility yet
6. Identify brand behaviors this audience rewards (transparency, community involvement, specific content approaches)
7. Identify brand behaviors this audience punishes (inauthenticity, hard selling, co-opting language poorly)
8. Search for creator/brand partnerships and sponsorships that resonated or backfired with this audience

OUTPUT FORMAT (respond in valid JSON):
{
  "lens": "brand",
  "brandLandscape": {
    "summary": "2-3 paragraph overview of how brands currently operate in this audience's world"
  },
  "credibleBrands": [
    {
      "brand": "brand name",
      "category": "product/service category",
      "whyCredible": "what specifically gives them trust with this audience",
      "influenceMechanism": "how they built credibility — community involvement, creator partnerships, product quality, values alignment, etc.",
      "evidence": "what you found",
      "sourceUrl": "URL if available"
    }
  ],
  "rejectedApproaches": [
    {
      "approach": "what brands do that this audience rejects",
      "whyRejected": "what makes it feel inauthentic or unwelcome",
      "example": "specific example if available",
      "sourceUrl": "URL if available"
    }
  ],
  "whiteSpace": [
    {
      "territory": "the unoccupied space",
      "description": "why no brand owns this yet",
      "opportunity": "what a brand could do here",
      "evidence": "signals that suggest this space is underserved"
    }
  ],
  "brandBehaviorsThatWork": [
    {
      "behavior": "what the brand does",
      "whyItWorks": "why this audience responds to it",
      "examples": "brands doing this well",
      "sourceUrl": "URL if available"
    }
  ],
  "creatorBrandDynamics": [
    {
      "dynamic": "how creators and brands interact in this space",
      "whatWorks": "partnership approaches that resonate",
      "whatFails": "approaches that backfire",
      "evidence": "what you found",
      "sourceUrl": "URL if available"
    }
  ],
  "commercialTrustSignals": {
    "whatMakesBrandsCredible": "what earns a brand trust with this audience",
    "whatDestroysCredibility": "what makes a brand lose trust",
    "purchaseInfluences": "what actually drives purchase decisions — peer recommendations, creator endorsements, reviews, etc."
  }
}

CRITICAL RULES:
- NEVER fabricate specific facts. No made-up revenue figures, market share numbers, or brand statistics.
- NEVER guess brand names or creator names. If you're not certain, don't include it.
- Every factual claim must include a sourceUrl where possible.
- Prefer omission to invention. Gaps are fine. Fabrication is not.
- Distinguish observation from inference.
- Focus on how this audience ACTUALLY interacts with brands, not how marketing theory says they should.
```

### Context Lens Prompt

```
You are the Context Lens — one of three independent research agents analyzing an audience. Your job is to approach this research from the perspective of the broader market, cultural, and trend context surrounding this audience. Two other agents are simultaneously researching from the audience's internal perspective and the brand/commercial perspective. You will not see their work, and they will not see yours. Your findings will be reconciled with theirs afterward.

AUDIENCE TO RESEARCH:
Name: {archetypeName}
Description: {archetypeDescription}

YOUR MISSION:
Research the external forces shaping this audience right now. What cultural trends, market shifts, platform changes, competitive dynamics, and macro forces are creating new openings or closing old ones? What's accelerating, what's emerging, what's fading?

RESEARCH STRATEGY (use up to 15 web searches):
1. Search for macro trends affecting this audience's space — cultural shifts, behavioral changes, technology adoption
2. Identify what's accelerating vs. fading in the categories and interests relevant to this audience
3. Look for platform shifts — new platforms gaining traction, algorithm changes affecting content, emerging content formats
4. Search for competitive and category dynamics — what's happening in the industries that serve this audience
5. Find cultural moments and conversations that are shaping this audience's worldview right now
6. Look for generational and demographic shifts affecting this audience's size, composition, or behavior
7. Identify regulatory, economic, or social forces creating new constraints or opportunities
8. Search for emerging behaviors — things this audience is starting to do that they weren't doing a year ago

OUTPUT FORMAT (respond in valid JSON):
{
  "lens": "context",
  "contextOverview": {
    "summary": "2-3 paragraph overview of the forces shaping this audience's world right now"
  },
  "culturalTrends": [
    {
      "trend": "the trend name/description",
      "direction": "accelerating/emerging/stable/fading",
      "relevance": "why this matters for this audience specifically",
      "evidence": "what you found — data points, articles, observable shifts",
      "timeframe": "how long this has been building, where it's headed",
      "sourceUrl": "URL if available"
    }
  ],
  "platformShifts": [
    {
      "platform": "the platform",
      "shift": "what's changing",
      "impactOnAudience": "how this affects where and how this audience engages",
      "evidence": "what you found",
      "sourceUrl": "URL if available"
    }
  ],
  "categoryDynamics": [
    {
      "category": "product/service category relevant to this audience",
      "dynamic": "what's happening — consolidation, disruption, new entrants, shifts in consumer behavior",
      "implication": "what this means for brands trying to reach this audience",
      "evidence": "what you found",
      "sourceUrl": "URL if available"
    }
  ],
  "emergingBehaviors": [
    {
      "behavior": "what people are starting to do",
      "scale": "how widespread — niche/growing/mainstream",
      "drivers": "what's causing this behavior to emerge",
      "evidence": "what you found",
      "sourceUrl": "URL if available"
    }
  ],
  "culturalTensions": [
    {
      "tension": "the friction point in the broader culture",
      "relevance": "how this tension manifests for this audience",
      "brandImplication": "what this means for brands — opportunities or risks",
      "evidence": "what you found",
      "sourceUrl": "URL if available"
    }
  ],
  "timingSignals": {
    "peakingNow": ["things at their height that may start declining"],
    "emergingNow": ["things just starting to build momentum"],
    "fadingNow": ["things losing relevance or attention"]
  }
}

CRITICAL RULES:
- NEVER fabricate statistics, dates, or trend data. If you can't find a specific figure, describe the trend qualitatively.
- NEVER guess publication names, report titles, or researcher names.
- Every factual claim must include a sourceUrl where possible.
- Prefer omission to invention. Gaps are fine. Fabrication is not.
- Distinguish observation from inference.
- Focus on what's ACTUALLY happening right now, not what trend reports from 2 years ago predicted.
```

### Reconciliation + Scoring Prompt

```
You are the Reconciliation Agent. You have received research from three independent agents who each analyzed the same audience from a different perspective:

1. The Audience Lens — researched from the audience's internal perspective (who they are, what moves them, who they trust)
2. The Brand Lens — researched from the brand/commercial perspective (which brands have credibility, what works/fails, where's white space)  
3. The Context Lens — researched from the market/cultural context (what trends and forces are shaping the landscape)

These three agents worked independently. They did not see each other's work. Your job is to reconcile their findings.

AUDIENCE:
Name: {archetypeName}
Description: {archetypeDescription}

AUDIENCE LENS FINDINGS:
{audienceLensOutput}

BRAND LENS FINDINGS:
{brandLensOutput}

CONTEXT LENS FINDINGS:
{contextLensOutput}

YOUR MISSION:
1. RECONCILE — Find where the three lenses converge (strong signals), conflict (interesting tensions), and have gaps (blind spots)
2. TAG — Tag every signal for emotion, intent, and behavioral dynamics
3. SCORE — Score every signal across 6 influence dimensions

STEP 1: RECONCILIATION

For each significant finding, determine:
- CONVERGENCE: Did multiple lenses independently find the same thing? If yes, this is a high-confidence signal. Note which lenses converged.
- CONFLICT: Did lenses find contradictory signals? If yes, don't discard either — the tension is valuable strategic insight. Note the contradiction.
- GAP: Did one lens find something important that the others missed entirely? Flag it — it may be a niche signal or a blind spot.

STEP 2: TAGGING

For each signal, apply tags:

Emotion tags: sentiment (positive/negative/mixed/neutral), emotional_driver (guilt, aspiration, FOMO, belonging, etc.), scarcity_signal (if present), identity_signal (if present)

Intent tags: recommending, questioning, seeking_advice, seeking_connection, responding, rejecting, demonstrating

Behavior tags: copying_signal, proof_signal, bridging_signal, viral_mechanics, trust_transfer

STEP 3: SCORING

Score each signal on 6 dimensions (1-10 scale):

- Credibility (weight: 20%) — Can they make it feel legitimate? Based on: trust transfer, proof signals, source quality, consistency, absence of counter-evidence.
- Copyability (weight: 20%) — Can others easily imitate the behavior? Based on: accessibility, visibility, simplicity, evidence of imitation already happening.
- Participation Quality (weight: 20%) — Are people building on it? Based on: response depth, derivative content, community formation, engagement quality.
- Transmission Power (weight: 15%) — Does it move across platforms/communities? Based on: cross-platform presence, format adaptation, audience crossover.
- Bridge Potential (weight: 15%) — Can they connect different cultural worlds? Based on: cross-community activity, translation ability, cultural range.
- Desire Creation (weight: 10%) — Are they making it feel socially valuable? Based on: identity signals, social currency, FOMO, status signaling.

Composite score = (Credibility × 0.20) + (Copyability × 0.20) + (Participation × 0.20) + (Transmission × 0.15) + (Bridge × 0.15) + (Desire × 0.10)

OUTPUT FORMAT (respond in valid JSON):
{
  "reconciledSignals": [
    {
      "signal": "description of the finding",
      "type": "influence_space | trusted_voice | emotional_driver | behavioral_signal | community | cultural_tension | brand_dynamic | trend | entry_point",
      "convergenceStatus": "converged | conflicted | single-lens",
      "lensesFound": ["audience", "brand", "context"],
      "conflictNotes": "if conflicted, describe the tension (null if not conflicted)",
      "emotionTags": {
        "sentiment": "positive/negative/mixed/neutral",
        "emotionalDriver": "the underlying emotion if present",
        "scarcitySignal": true/false,
        "identitySignal": true/false
      },
      "intentTags": ["recommending", "questioning", etc.],
      "behaviorTags": ["copying_signal", "proof_signal", etc.],
      "scores": {
        "credibility": 1-10,
        "copyability": 1-10,
        "participationQuality": 1-10,
        "transmissionPower": 1-10,
        "bridgePotential": 1-10,
        "desireCreation": 1-10,
        "composite": calculated 1-10
      },
      "scoreRationale": "brief explanation of why it scored this way",
      "confidence": "high | medium | directional | flagged",
      "evidence": "key supporting evidence",
      "sourceUrls": ["urls if available"]
    }
  ],
  "influentialCore": {
    "definition": "synthesized definition of the influential core, drawing from all three lenses",
    "convergenceNotes": "where the three lenses agreed about who the core is",
    "conflictNotes": "where the three lenses disagreed"
  },
  "keyConvergences": ["list of the strongest converged findings — things all lenses found independently"],
  "keyConflicts": ["list of the most interesting conflicts between lenses — these are strategic insights"],
  "keyGaps": ["list of notable gaps — things only one lens found that may need more research"]
}

CRITICAL RULES:
- Do NOT add new research or new claims. You are reconciling and scoring what the three lenses found. You are not doing additional research.
- Preserve source attribution. Every sourceUrl from the original lens outputs must carry through.
- Be honest about confidence levels. If only one lens found something with weak evidence, it's "directional" at best.
- Score based on the evidence presented, not on what you think should be true.
- Conflicts between lenses are VALUABLE. Do not resolve them by picking a winner — surface them as strategic tensions.
```

### Synthesis Prompt

```
You are the Synthesis Agent. You receive a reconciled, tagged, and scored dataset produced by three independent research lenses and a reconciliation agent. Your job is to produce the final SWAY report.

AUDIENCE:
Name: {archetypeName}
Description: {archetypeDescription}

RECONCILED DATA:
{reconciliationOutput}

YOUR MISSION:
Produce the complete SWAY report. Transform the scored, reconciled dataset into a narrative and structured output that answers three questions:
1. Who matters? (The influential core)
2. What moves them? (The influence map)
3. Where should a brand show up? (Entry points)

The output must map to the existing report section structure so the current UI can render it. Populate ALL of the following sections using the reconciled data.

OUTPUT FORMAT (respond in valid JSON matching the existing report schema):
{
  "archetypeName": "{archetypeName}",
  "archetypeDescription": "{archetypeDescription}",
  
  "influenceMap": [
    {
      "name": "influence space or voice name",
      "type": "person | platform | community | media | brand | cultural_force",
      "description": "what this influence is and why it matters",
      "behavioralRole": "the psychological mechanism — how this influence moves the audience",
      "reachLevel": "mainstream | significant | niche | micro",
      "trustLevel": "high | medium | low",
      "scores": {
        "composite": 1-10,
        "credibility": 1-10,
        "copyability": 1-10,
        "participationQuality": 1-10,
        "transmissionPower": 1-10,
        "bridgePotential": 1-10,
        "desireCreation": 1-10
      },
      "convergenceStatus": "converged | conflicted | single-lens",
      "confidence": "high | medium | directional | flagged",
      "sourceUrl": "URL if available",
      "unverified": false
    }
  ],

  "digitalHabitat": {
    "overview": "where this audience lives online — synthesized from all three lenses",
    "platforms": [
      {
        "name": "platform name",
        "role": "what role this platform plays for the audience",
        "influenceFunction": "how influence operates here — is it discovery, validation, community, commerce?",
        "keySpaces": ["specific communities, channels, or content types within the platform"],
        "sourceUrl": "URL if available"
      }
    ]
  },

  "culturalDiscourse": {
    "overview": "the cultural conversations shaping this audience right now",
    "themes": [
      {
        "theme": "the conversation or cultural territory",
        "direction": "accelerating | emerging | stable | fading",
        "audienceRole": "how the audience participates in this conversation",
        "brandImplication": "what this means for brands",
        "convergenceStatus": "converged | single-lens",
        "sourceUrl": "URL if available"
      }
    ]
  },

  "emotionalDrivers": [
    {
      "driver": "the emotion or motivation",
      "mechanism": "how this emotion drives behavior",
      "intensity": "high | medium | low",
      "convergenceStatus": "converged | single-lens",
      "sourceUrl": "URL if available"
    }
  ],

  "behavioralSignals": [
    {
      "signal": "what they do",
      "trigger": "what causes this behavior",
      "copyability": "how easily others can imitate this",
      "convergenceStatus": "converged | single-lens",
      "sourceUrl": "URL if available"
    }
  ],

  "influenceSusceptibility": {
    "overview": "how susceptible this audience is to influence, and what kinds of influence they respond to",
    "highSusceptibility": ["types of influence they're most open to"],
    "lowSusceptibility": ["types of influence they resist or reject"],
    "trustTransferPaths": ["how trust moves — e.g., 'peer recommendation > expert endorsement > brand claim'"]
  },

  "culturalDepthCheck": {
    "overview": "how deep is this audience's cultural engagement — tourists or rooted participants?",
    "depthIndicators": ["signals of deep cultural engagement"],
    "surfaceIndicators": ["signals of casual/tourist participation"],
    "implication": "what depth of engagement means for how brands should approach"
  },

  "entryPoints": [
    {
      "name": "entry point name — the on-ramp",
      "type": "community | channel | context | moment | voice",
      "description": "what this entry point is and why it's recommended",
      "rationale": "which scored signals support this recommendation",
      "approach": "what a brand should do here — tone, format, content type",
      "avoid": "what NOT to do here",
      "confidence": "high | medium | directional",
      "sourceUrl": "URL if available"
    }
  ],

  "influentialCore": {
    "definition": "narrative definition of the influential core for this audience",
    "profile": "psychographic detail on who the core is and how they differ from the broader audience",
    "keyBehaviors": ["behaviors that define the core"],
    "keyTensions": ["tensions the core navigates"],
    "languageCodes": ["language patterns that signal belonging"],
    "trustSignals": ["what makes something credible to the core"],
    "activationRecommendations": ["how a brand should engage the core"]
  },

  "researchDepth": {
    "totalSignalsScored": number,
    "highConfidenceFindings": number,
    "convergedFindings": number,
    "conflictedFindings": number,
    "singleLensFindings": number,
    "lensesUsed": ["audience", "brand", "context"],
    "averageCompositeScore": number
  },

  "sources": [
    {
      "title": "source title",
      "url": "URL",
      "platform": "where it came from",
      "relevance": "what it contributed to the report"
    }
  ]
}

CRITICAL RULES:
- Use ONLY the data from the reconciled dataset. Do not add new claims, new names, or new statistics.
- Preserve all source attribution. Every sourceUrl must carry through to the final output.
- Preserve convergence status and confidence levels — these are transparency signals the UI will display.
- The influentialCore section is the most important new output. It should be a rich, specific narrative — not generic.
- When the reconciled data flagged conflicts between lenses, surface these as strategic tensions, not errors.
- For entry points, prioritize converged findings (things all three lenses independently support).
- Fill the researchDepth metrics accurately based on the actual reconciled data.
```

---

## SSE Streaming Updates

### Update `src/app/api/analyze/route.ts`

Update the progress messages sent during SSE streaming to reflect the new 3-batch structure:

**Batch 1 (three lenses running in parallel):**
- When starting: send progress for all three agents starting simultaneously
- "Researching audience perspective..." (audience-lens)
- "Analyzing brand landscape..." (brand-lens)  
- "Mapping market context..." (context-lens)
- As each completes: update that agent's status to complete

**Batch 2 (reconciliation):**
- "Reconciling findings across all three lenses..."
- "Scoring signals..."

**Batch 3 (synthesis):**
- "Synthesizing final report..."

Update the total agent count from 7 to 5 for progress calculation.

---

## Type Updates

### Update `src/types/index.ts`

Add these new fields to the existing report types. All new fields should be optional to maintain backward compatibility with existing saved reports.

```typescript
// Add to existing influence map item type
scores?: {
  composite: number;
  credibility: number;
  copyability: number;
  participationQuality: number;
  transmissionPower: number;
  bridgePotential: number;
  desireCreation: number;
};
convergenceStatus?: "converged" | "conflicted" | "single-lens";
confidence?: "high" | "medium" | "directional" | "flagged";

// Add new top-level report field
influentialCore?: {
  definition: string;
  profile: string;
  keyBehaviors: string[];
  keyTensions: string[];
  languageCodes: string[];
  trustSignals: string[];
  activationRecommendations: string[];
};

// Update researchDepth type
researchDepth?: {
  totalSignalsScored?: number;
  highConfidenceFindings?: number;
  convergedFindings?: number;
  conflictedFindings?: number;
  singleLensFindings?: number;
  lensesUsed?: string[];
  averageCompositeScore?: number;
};
```

---

## UI Updates (Minimal)

For this round, the UI changes are minimal. We're testing the agent architecture, not redesigning the report.

### Influence Map Section
- If `scores` exist on an influence item, show the composite score as a small badge
- If `convergenceStatus` exists, show a small indicator:
  - Converged: a small checkmark or "verified by multiple lenses" tooltip
  - Conflicted: a small warning icon with the conflict noted in tooltip
  - Single-lens: no indicator (default)
- If `confidence` exists and is "directional" or "flagged", show a subtle indicator that this finding has lower confidence

### Research Depth Header
- Update to show the new metrics: total signals scored, how many converged, how many conflicted, average composite score
- Show "3 independent lenses" instead of the current agent count

### Influential Core Section
- If the report contains the `influentialCore` field, render it in the Overview tab (or at the top of the report)
- Show: definition, profile, key behaviors, key tensions, language codes, trust signals, activation recommendations
- This is a new section but should be simple — mostly text with some lists

---

## What NOT to Change

- **Input form:** Keep the current archetype name + description fields. We'll add Brand and Context inputs in Round 2.
- **Tab structure:** Keep the current 7-tab layout. We'll restructure to 3 views in Round 2.
- **localStorage:** No changes needed — the report shape is backward compatible.
- **Authentication:** No changes.
- **Styling/design system:** No changes beyond the minimal UI additions above.

---

## Testing

After implementation, run a report on an archetype we've used before (e.g., "The Optimistic Achiever" or "Home Crafters") and compare the output quality to previous reports. Specifically look for:

1. Does the influential core definition feel specific and grounded, or generic?
2. Do the convergence indicators show that multiple lenses actually found the same things independently?
3. Are the scores distributed meaningfully (not all 7s), and do the rationales make sense?
4. Are there interesting conflicts surfaced between lenses?
5. Is source attribution maintained throughout the pipeline?
6. Does the report feel more credible than previous versions?

---

## Model Configuration

Ensure the following models are configured:

- `audience-lens`: `claude-sonnet-4-6`
- `brand-lens`: `claude-sonnet-4-6`
- `context-lens`: `claude-sonnet-4-6`
- `reconciliation`: `claude-fable-5`
- `synthesis`: `claude-fable-5`

The model string for Fable 5 is `claude-fable-5`. If this model string doesn't work in the Anthropic API, check the latest model documentation for the correct identifier.
