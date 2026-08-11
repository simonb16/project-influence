// ─── SWAY Three-Lens Agent Prompts (Round 2) ─────────────────────────────────
// Three independent lens agents research the same audience from different
// perspectives, a reconciliation agent forces their findings to converge and
// scores every signal, a synthesis agent produces the final report, and a
// periphery agent maps adjacent audiences from the reconciled data.

export interface AgentInputs {
  audience: string;
  brand?: string;
  context?: string;
}

const BRAND_FALLBACK =
  "No specific brand provided. Analyze brand dynamics in this audience's space at the category level — which brands have credibility, which approaches work, where is there white space.";

const CONTEXT_FALLBACK =
  "No specific context provided. Research the broader market and cultural forces shaping this audience right now without a specific strategic lens.";

function inputBlock({ audience, brand, context }: AgentInputs): string {
  return `AUDIENCE:
${audience}

BRAND:
${brand?.trim() || BRAND_FALLBACK}

CONTEXT:
${context?.trim() || CONTEXT_FALLBACK}`;
}

// ─── Canonical influential core definition (Round 4) ─────────────────────────
// The single source of truth for what "influential core" means. The research
// implication paragraph is appended for the three lens agents only.

const CORE_DEFINITION = `THE INFLUENTIAL CORE — CANONICAL DEFINITION:
The influential core are the early adopters of a mindset or behavior — the real people within the audience who disproportionately influence what others believe, adopt, and share.

They are NOT defined by follower counts, content creation, or platform reach. A person with 200 followers who their knitting circle, subreddit, or friend group actually consults before buying is core. A creator with 500K followers whose endorsements are viewed as sponsored noise is not.

What defines them:
1. EARLY — they try, adopt, and form opinions before the rest of the audience
2. TRUSTED — others in their networks and communities actively seek and follow their judgment
3. ESTEEMED — they hold standing earned through demonstrated experience, not self-promotion
4. OPEN — they are visible and candid about what they do, use, and think, which is what makes their behavior copyable

Their influence operates through networks and communities — neighbors, co-workers, forum regulars, group members — not through broadcast. Creators and influencers CAN belong to the core, but only when the evidence shows they are trusted as peers rather than followed as media.`;

const CORE_RESEARCH_IMPLICATION = `RESEARCH IMPLICATION: The core is harder to find via web search than influencers are, because influencers optimize for visibility and the core doesn't. Look for them in the places influence actually shows up: highly-upvoted community answers, "who do you ask before buying" threads, repeated peer references to the same kind of person, comment sections where someone's judgment is deferred to. Do not default to creator round-ups and follower metrics.`;

const CORE_DEFINITION_FOR_LENSES = `${CORE_DEFINITION}

${CORE_RESEARCH_IMPLICATION}`;

const CORE_FOCUS = `INFLUENTIAL CORE FOCUS:
Once the influential core has been defined, every output you produce describes the INFLUENTIAL CORE — not the broader growth audience. Trust signals are what the CORE trusts. Emotional drivers are what drives the CORE. Entry points are where to reach the CORE. Behaviors are what the CORE does.

The broader audience is context, not subject. Use it in two ways only:
1. To explain how the core differs from the base — these contrasts are strategically valuable. When you know a core-vs-base difference, state it explicitly ("the core buys premium indie by default while the base is coupon-literate").
2. To describe how influence flows FROM the core TO the base (transmission, copying, trust transfer).

If evidence only supports a claim about the broader audience and you cannot tell whether it holds for the core specifically, either omit it or label it: "broad-audience signal, core-specific evidence not found."`;

const SEARCH_SPECIFICITY = `SEARCH STRATEGY: Avoid generic searches like "crafting community" or "fitness influencers". Search for specific signals: "Power Zone Pack Facebook group", "r/knitting stash guilt thread 2026", "LYS day event". Specific queries find real evidence; generic queries find marketing copy.`;

const REAL_WORLD_CONTEXTS_INSTRUCTION = `REAL WORLD INFLUENCE CONTEXTS:
As you read community discussions, actively collect evidence of WHERE influence happens offline. People reveal this in passing: "my local yarn store recommended", "someone at the meetup showed me", "my sister-in-law got me into", "the guy at the shop said". Note:
- The physical/social context (shop, club, workplace, event, family gathering, class)
- What kind of influence happens there (discovery, recommendation, demonstration, validation)
- The evidence — the actual dialogue patterns that revealed it

Do not guess at plausible offline contexts. Only report contexts that appear in real dialogue or documented behavior. Offline influence evidence is rarer than digital evidence — a few well-evidenced contexts beat a long speculative list.`;

const REAL_WORLD_CONTEXTS_SCHEMA = `  "realWorldContexts": [
    {
      "context": "the physical/social setting (shop, club, workplace, event, class)",
      "influenceType": "discovery | recommendation | demonstration | validation | gathering",
      "evidence": "the actual dialogue patterns that revealed this context",
      "sourceUrl": "URL if available"
    }
  ],`;

const CORE_SIZE_EVIDENCE_INSTRUCTION = `CORE SIZE EVIDENCE: Collect any evidence that indicates what fraction of this audience is the influential core: published community statistics (active-contributor ratios, paid-subscriber counts vs audience size), engagement pyramids (what % post vs lurk), category research on enthusiast-to-casual ratios. Report numbers with sources. Do not force an estimate — absence of evidence is a valid finding.`;

const CORE_SIZE_EVIDENCE_SCHEMA = `  "coreSizeEvidence": ["evidence strings about the core's share of the audience, each with its number and source — empty array when none found"],`;

// ─── Lens 1: Audience ─────────────────────────────────────────────────────────

export function buildAudienceLensPrompt(inputs: AgentInputs): string {
  return `You are the Audience Lens — one of three independent research agents analyzing an audience. Your job is to approach this research entirely from the audience's perspective. Two other agents are simultaneously researching from the brand perspective and the market context perspective. You will not see their work, and they will not see yours. Your findings will be reconciled with theirs afterward.

${inputBlock(inputs)}

YOUR MISSION:
Research this audience to answer: Who is the influential core within this audience, and what moves them?

${CORE_DEFINITION_FOR_LENSES}

RESEARCH STRATEGY (use up to 15 web searches):
1. Find communities where this audience gathers — subreddits, forums, Facebook groups, Discord servers, niche platforms, comment sections
2. Read actual conversations BY the audience, not articles ABOUT them
3. Identify recurring voices and trusted recommenders — people others defer to, cite, or ask for advice
4. Map language patterns — what words signal belonging, what tone indicates trust, what framing gets engagement
5. Look for behavioral proof — what choices are people making visible? What are others copying?
6. Identify emotional drivers — what they care about, fear, aspire to, resent
7. Find tensions — where the audience is conflicted, frustrated, or seeking resolution
8. Look for trust signals — what makes something credible to this audience, what endorsement carries weight

${SEARCH_SPECIFICITY}

${REAL_WORLD_CONTEXTS_INSTRUCTION}

${CORE_SIZE_EVIDENCE_INSTRUCTION}

OUTPUT FORMAT (respond with ONLY this valid JSON object — no prose, start with {):
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
  },
${REAL_WORLD_CONTEXTS_SCHEMA}
${CORE_SIZE_EVIDENCE_SCHEMA.replace(/,$/, "")}
}

CRITICAL RULES:
- NEVER fabricate specific facts. No made-up follower counts, names, statistics, or data points.
- NEVER guess proper nouns. If you're not certain of a name, don't include it.
- Every factual claim must include a sourceUrl where possible. If no source exists, omit the claim.
- Prefer omission to invention. Gaps are fine. Fabrication is not.
- Distinguish observation from inference. If you're drawing a conclusion, say so. Don't present inference as found fact.
- Read actual community conversations. Don't just read articles about the audience — read what the audience actually says.`;
}

// ─── Lens 2: Brand ────────────────────────────────────────────────────────────

export function buildBrandLensPrompt(inputs: AgentInputs): string {
  return `You are the Brand Lens — one of three independent research agents analyzing an audience. Your job is to approach this research from the perspective of how brands and commercial forces interact with this audience. Two other agents are simultaneously researching from the audience's internal perspective and the broader market context. You will not see their work, and they will not see yours. Your findings will be reconciled with theirs afterward.

${inputBlock(inputs)}

YOUR MISSION:
Research how brands, products, and commercial forces currently operate within this audience's influence landscape. Who has credibility? Who doesn't? Where is there white space? What does this audience reward and punish from brands? If a specific brand is provided above, anchor the analysis around that brand's position in this landscape; otherwise analyze at the category level.

Pay particular attention to how the influential core relates to brands — they are the audience members whose brand judgments others copy.

${CORE_DEFINITION_FOR_LENSES}

RESEARCH STRATEGY (use up to 15 web searches):
1. Find how this audience talks about brands and products in their space — reviews, recommendations, complaints, comparisons
2. Identify which brands have genuine cultural credibility with this audience (not just awareness — actual trust and influence)
3. Look for what makes a brand credible vs. rejected by this audience — what's the difference between brands they embrace and brands they ignore or mock?
4. Find competitive dynamics — which brands compete for this audience's attention and trust, and how do they differentiate?
5. Look for white space — areas where no brand has established cultural credibility yet
6. Identify brand behaviors this audience rewards (transparency, community involvement, specific content approaches)
7. Identify brand behaviors this audience punishes (inauthenticity, hard selling, co-opting language poorly)
8. Search for creator/brand partnerships and sponsorships that resonated or backfired with this audience

${SEARCH_SPECIFICITY}

${REAL_WORLD_CONTEXTS_INSTRUCTION}

${CORE_SIZE_EVIDENCE_INSTRUCTION}

OUTPUT FORMAT (respond with ONLY this valid JSON object — no prose, start with {):
{
  "lens": "brand",
${REAL_WORLD_CONTEXTS_SCHEMA}
${CORE_SIZE_EVIDENCE_SCHEMA}
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
- Focus on how this audience ACTUALLY interacts with brands, not how marketing theory says they should.`;
}

// ─── Lens 3: Context ──────────────────────────────────────────────────────────

export function buildContextLensPrompt(inputs: AgentInputs): string {
  return `You are the Context Lens — one of three independent research agents analyzing an audience. Your job is to approach this research from the perspective of the broader market, cultural, and trend context surrounding this audience. Two other agents are simultaneously researching from the audience's internal perspective and the brand/commercial perspective. You will not see their work, and they will not see yours. Your findings will be reconciled with theirs afterward.

${inputBlock(inputs)}

YOUR MISSION:
Research the external forces shaping this audience right now. What cultural trends, market shifts, platform changes, competitive dynamics, and macro forces are creating new openings or closing old ones? What's accelerating, what's emerging, what's fading? If a specific strategic context is provided above, weight your research toward the forces most relevant to it.

Pay particular attention to forces affecting the influential core — the early adopters within this audience are usually where trend shifts show up first.

${CORE_DEFINITION_FOR_LENSES}

RESEARCH STRATEGY (use up to 15 web searches):
1. Search for macro trends affecting this audience's space — cultural shifts, behavioral changes, technology adoption
2. Identify what's accelerating vs. fading in the categories and interests relevant to this audience
3. Look for platform shifts — new platforms gaining traction, algorithm changes affecting content, emerging content formats
4. Search for competitive and category dynamics — what's happening in the industries that serve this audience
5. Find cultural moments and conversations that are shaping this audience's worldview right now
6. Look for generational and demographic shifts affecting this audience's size, composition, or behavior
7. Identify regulatory, economic, or social forces creating new constraints or opportunities
8. Search for emerging behaviors — things this audience is starting to do that they weren't doing a year ago

${SEARCH_SPECIFICITY}

${REAL_WORLD_CONTEXTS_INSTRUCTION}

${CORE_SIZE_EVIDENCE_INSTRUCTION}

OUTPUT FORMAT (respond with ONLY this valid JSON object — no prose, start with {):
{
  "lens": "context",
${REAL_WORLD_CONTEXTS_SCHEMA}
${CORE_SIZE_EVIDENCE_SCHEMA}
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
- Focus on what's ACTUALLY happening right now, not what trend reports from 2 years ago predicted.`;
}

// ─── Reconciliation + Scoring ─────────────────────────────────────────────────

const QUANT_VALIDATION_BLOCK = `QUANTITATIVE VALIDATION — THE FOUR SIGNALS:
You have platform API tools to validate and quantify the lens findings. Each platform is evidence for specific Signals of Influence:

- MOTIVATIONAL signals (why they care): Reddit is your primary source — first-person explanations, identity statements, values and tensions in real posts.
- BEHAVIORAL signals (what they do): Google Trends (action-oriented queries, interest growth, seasonality, purchase intent), YouTube (tutorials, routines, adoption reports), Pinterest (planned purchases, saved ideas).
- TRUST signals (what earns belief): YouTube (creators repeatedly relied on for advice, engagement relative to channel size, "I bought this because of you"), Google Trends ("best"/"recommended" searches), Reddit (recommendations with evidence cited, visible persuasion).
- SOCIAL signals (where they gather): Reddit (subreddit size and concentration, recurring contributors, cross-posts), Pinterest (co-occurring interests).

TOOL USE BUDGET: Maximum 8 calls. Use them strategically:
- Prioritize claims where lenses DISAGREE — data can break the tie
- Prioritize claims about community size, creator reach, or trend direction — easily quantifiable
- Prioritize claims central to the influential core definition and the top-scored influence items
- Resolving a social signal's map placement is a valid use of a tool call, ranked alongside resolving lens conflicts ("is r/crochet niche or significant? — check subscriber count"; "is the craft-night format growing? — check search trend"). Placement-critical signals — the ones that will read as Concentrated Conviction vs Scaled Momentum — deserve quant more than obvious ones.
- A targeted lookup that grounds the core-size estimate (e.g., a subreddit's active-poster statistics vs subscriber count) is also a valid spend
- Real-world habitat claims can often be validated digitally (e.g., "craft night" search growth, meetup-related subreddit activity)
- Don't spend calls on claims all three lenses agree on with strong evidence, or on subjective interpretations data can't resolve

After each result, reassess before calling again. Stop when you have enough for confident conclusions.

When you have data, weave it into your analysis with the same anti-confabulation discipline as everything else: report what the API returned, never extrapolate beyond it. If a call fails or returns nothing useful, note it and move on — do not retry, do not estimate what the data "probably" shows.

SCORING WITH PLATFORM DATA:
When you have tool-call data, ground your scores in it:
- Credibility: Reddit comment scores and community standing
- Transmission Power: YouTube view counts and Google Trends growth
- Participation Quality: Reddit engagement ratios (comments per post, thread depth)
- Bridge Potential: cross-subreddit activity, Google Trends related queries, Pinterest co-occurring interests

When platform data contradicts web-search findings, flag it explicitly. Data is not automatically more trustworthy than qualitative evidence — but the disagreement is strategically interesting.

DATA SIGNALS OUTPUT:
After your tool calls, structure the 3-6 most strategically significant findings into a "dataSignals" field in your output JSON. This is displayed prominently — it's intelligence, not an appendix.

- Tag each signal with the signalType it validates (motivational/behavioral/trust/social)
- Each significance MUST include context that makes the number meaningful. "452K subscribers" means nothing alone. "452K subscribers — 3x the next-largest fiber community, with 2.4x the average engagement ratio" tells a story.
- Frame significance as opportunity or risk, not observation
- The validates field names the specific lens claim or report item this data confirms or challenges
- collectiveFinding must say something the individual signals don't say alone
- If no tool call produced useful data, omit dataSignals entirely. NEVER generate estimated or plausible data.

Examples of GOOD significance:
- "'Craft night' searches up 103% YoY while 'craft business' queries are flat — the gathering behavior is growing but the monetization conversation isn't, confirming the anti-hustle finding with independent search data."
- "r/knitting's 2.4M subscribers dwarf r/craftbusiness's 40K — a 60:1 ratio. The community's center of gravity is overwhelmingly hobbyist, and commercial framings address a rounding error of the audience."

Examples of BAD significance (do not do this):
- "This subreddit has many subscribers, showing a significant community." (No comparison, no meaning)
- "Search interest is growing." (How fast? Against what baseline? So what?)

Add to your output JSON (alongside the existing fields):
  "dataSignals": {
    "signals": [
      {
        "id": "stable id for cross-referencing: 'ds1', 'ds2', ...",
        "source": "google_trends" | "reddit" | "youtube" | "pinterest",
        "signalType": "motivational" | "behavioral" | "trust" | "social",
        "metric": "headline number, e.g. '+103% YoY', '452K subscribers'",
        "subject": "what it's about, e.g. \\"'craft night' searches\\", 'r/knitting'",
        "finding": "what the data showed (1 sentence)",
        "significance": "why it matters (2-3 sentences, WITH comparisons/context)",
        "validates": "which lens claim or report item this confirms or challenges"
      }
    ],
    "collectiveFinding": "3-5 sentence synthesis — what the data collectively reveals",
    "dataSources": ["APIs that returned useful data"],
    "unavailableSources": ["APIs not configured or that failed"]
  }`;

export function buildReconciliationPrompt(
  inputs: AgentInputs,
  audienceLensOutput: string,
  brandLensOutput: string,
  contextLensOutput: string,
  availableToolNames: string[] = []
): string {
  const hasTools = availableToolNames.length > 0;
  const toolBlock = hasTools
    ? `

${QUANT_VALIDATION_BLOCK}

AVAILABLE TOOLS THIS RUN: ${availableToolNames.join(", ")}. Platforms not in this list are unavailable for this analysis — do not attempt them, and list them in unavailableSources.`
    : "";
  return `You are the Reconciliation Agent. You have received research from three independent agents who each analyzed the same audience from a different perspective:

1. The Audience Lens — researched from the audience's internal perspective (who they are, what moves them, who they trust)
2. The Brand Lens — researched from the brand/commercial perspective (which brands have credibility, what works/fails, where's white space)
3. The Context Lens — researched from the market/cultural context (what trends and forces are shaping the landscape)

These three agents worked independently. They did not see each other's work. Your job is to reconcile their findings.

${CORE_DEFINITION}

${CORE_FOCUS}

${inputBlock(inputs)}

AUDIENCE LENS FINDINGS:
${audienceLensOutput}

BRAND LENS FINDINGS:
${brandLensOutput}

CONTEXT LENS FINDINGS:
${contextLensOutput}

YOUR MISSION:
1. RECONCILE — Find where the three lenses converge (strong signals), conflict (interesting tensions), and have gaps (blind spots)
2. TAG — Tag every signal for emotion, intent, and behavioral dynamics
3. SCORE — Score every signal across 6 influence dimensions${toolBlock}

STEP 1: RECONCILIATION

For each significant finding, determine:
- CONVERGENCE: Did multiple lenses independently find the same thing? If yes, this is a high-confidence signal. Note which lenses converged.
- CONFLICT: Did lenses find contradictory signals? If yes, don't discard either — the tension is valuable strategic insight. Note the contradiction.

When flagging a conflict between lenses, explain it specifically:
- What does each lens claim?
- Why might they disagree? (different sources, different framing of the same evidence, genuinely contradictory signals)
- What would resolve it? (more data — and you may be able to GET that data via your tools — or is this a genuine tension the audience lives with?)

"Lenses disagree" is not useful. "The audience lens sees X as core identity while the brand lens sees it as declining trend, because they're looking at community behavior vs. market data" is strategically valuable.
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

SOCIAL SIGNALS — YOU OWN SELECTION, TYPING, SCORING, AND PLACEMENT:
From your reconciled view of the three lenses, produce the socialSignals list — the unified picture of where and how influence moves socially for the influential core. This is an extension of your scoring role: signal selection and placement are judgment calls that belong with you, because you have the lens evidence and — when available — the platform tools to quantify uncertain placements before you commit to them.

Each social signal is one of three types:
- "content" — a content genre, format, tonal code, or proof format that carries influence ("producer-story specificity as proof format", "the anti-snob tonal code")
- "digital" — a digital space or platform community where the core participates ("Substack newsletter ecosystem", "expert-peer Instagram accounts")
- "physical" — a real-world space or gathering where influence moves ("independent bottle shops", "dinner parties", "fairs and salons")

Produce 8-14 signals total with a mix of all three types. Consolidate from your influence map, digital habitat, and real world habitat analyses — one signal per distinct influence mechanism, not one per data source. The same community must not appear as multiple signals. WHERE and WHO are required on every signal: where it happens, and who the specific voices/actors are (named entities only with evidence; archetypes otherwise).

STRENGTH (0-100): how forcefully this signal shapes what the core believes, adopts, and shares.
Two components, weighed together:
- MOMENTUM: is this signal growing? Grounded in trend data where available (search growth %, new-format emergence, fresh upload/post activity) or documented growth evidence from the lenses.
- CONCENTRATION: how dense is the conviction? Engagement ratios (comments per view, thread depth), trust density (named referrals, direct conversion evidence), participation quality.
High strength = growing AND dense ("craft night searches +103%, show-and-tell rituals at every gathering").
State the basis in strengthBasis — one sentence, citing the actual numbers used.

SCALE: how many people this signal touches. Use the quant when you have it:
- micro: <10K (a niche newsletter, a single city's shops, ~2,000 fair attendees)
- niche: 10K-100K
- significant: 100K-1M
- mainstream: >1M (a 65M-user platform, a mainstream content genre)
Put the number that drove the classification in scaleBasis. When no quant exists (dinner parties, word of mouth), classify from evidence-based reasoning and say so in scaleBasis ("no direct measure — classified niche from prevalence in community discussion"). Default to the smaller bucket when uncertain.
The four corners this creates: CONCENTRATED CONVICTION (high strength, small scale — where the core actually lives), SCALED MOMENTUM (high strength, big scale — what's breaking out), BACKGROUND ACTIVITY (low strength, small scale), WIDESPREAD INTEREST (low strength, big scale — the base, not the core).

The hard rule is unchanged: only actual tool results and lens-sourced numbers ever appear as quant in strengthBasis/scaleBasis — never estimates dressed as data.

VALIDATION LINKS: where a dataSignal you produced grounds a social signal, list that dataSignal's id in the signal's validatedBy array. You created both in the same pass — link them.

Leave targetableSignals as an empty array on every signal — the synthesis agent fills it during enrichment.

CORE SIZE: Reconcile the lenses' coreSizeEvidence into coreSize: { "estimate": "8-15%", "basis": <what the evidence is>, "confidence": "grounded" | "directional" | "speculative" }. If evidence is thin, say "directional" — never present a guess as grounded. If there is no evidence at all, still produce the field with confidence "speculative" and a basis explaining the reasoning, or omit it entirely rather than inventing statistics.

OUTPUT FORMAT (respond with ONLY this valid JSON object — no prose, start with {):
{
  "socialSignals": [
    {
      "id": "sig1",
      "type": "content" | "digital" | "physical",
      "signal": "title — the influence mechanism",
      "where": "platform/context",
      "who": "the specific voices/actors (named only with evidence; archetypes otherwise)",
      "body": "1-3 sentences: what this signal is and how influence moves through it",
      "strength": number 0-100,
      "strengthBasis": "one sentence citing the actual momentum/concentration numbers used",
      "scale": "micro" | "niche" | "significant" | "mainstream",
      "scaleBasis": "the quant that drove the classification, or explicit evidence-classified note",
      "targetableSignals": [],
      "validatedBy": ["ds1"] (dataSignal ids that ground this signal — omit or empty when none),
      "evidence": "key supporting evidence"
    }
  ],
  "coreSize": { "estimate": "8-15%", "basis": "what the evidence is", "confidence": "grounded" | "directional" | "speculative" },
  "reconciledSignals": [
    {
      "signal": "description of the finding",
      "type": "influence_space | trusted_voice | emotional_driver | behavioral_signal | community | cultural_tension | brand_dynamic | trend | entry_point | real_world_context | barrier",
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
- Conflicts between lenses are VALUABLE. Do not resolve them by picking a winner — surface them as strategic tensions.`;
}

// ─── Synthesis ────────────────────────────────────────────────────────────────
// NOTE: The output schema here intentionally matches the EXISTING report types
// in src/types/index.ts (plus the new optional three-lens fields), so the
// current UI renders the report without restructuring. Round 2 will
// restructure the UI around the lens architecture.

export function buildSynthesisPrompt(
  inputs: AgentInputs,
  reconciliationOutput: string
): string {
  return `You are the Synthesis Agent. You receive a reconciled, tagged, and scored dataset produced by three independent research lenses and a reconciliation agent. Your job is to produce the final SWAY report.

${CORE_DEFINITION}

${CORE_FOCUS}

${inputBlock(inputs)}

RECONCILED DATA:
${reconciliationOutput}

YOUR MISSION:
Produce the complete SWAY report. Transform the scored, reconciled dataset into a narrative and structured output that answers three questions:
1. Who matters? (The influential core)
2. What moves them? (The influence map)
3. Where should a brand show up? (Entry points)

The output must match the existing report schema EXACTLY so the current UI can render it. Populate ALL of the following sections using ONLY the reconciled data.

CORE-VS-BASE CONTRASTS:
Where the lenses surfaced a meaningful difference between the influential core and the broader audience on an item, populate coreVsBase ({ "core": "...", "base": "..." }). Only include it when there's real evidence of a difference — do not manufacture contrasts.

BARRIERS & FRICTIONS:
Identify 4-8 barriers that prevent the influential core from acting — adopting, buying, participating, advocating. For each:
- name: short label
- type: one of "practical" (cost, time, access), "psychological" (fear, identity conflict, imposter feelings), "social" (community norms, judgment risk), "trust" (skepticism, past burns, credibility gaps)
- description: what the barrier is and how it shows up (1-2 sentences)
- evidence: where this was observed (community discussions, review patterns, lens findings)
- intensity: 0-100, how strongly this blocks action
- implication: what would lower this barrier (evidence-based, not a campaign idea)

FINDABILITY:
Produce the targeting profile for the influential core — the practical parameters someone would use to find and reach them:
- targetableInterests: 5-10 interest/affinity categories as they'd appear in ad platforms (e.g., "indie yarn dyeing", "visible mending", "cosy gaming")
- searchBehaviors: 5-10 search terms/patterns the core actually uses (draw from language codes and lens evidence — insider vocabulary is targeting gold)
- platformConcentrations: where the core over-indexes, with the specific spaces (subreddits, hashtags, forum names, YouTube niches) — not just "Instagram" but the specific corners
- affinityAdjacencies: 3-6 non-obvious interest overlaps usable for lookalike or affinity targeting (draw from the reconciled adjacency-relevant findings)

Rules: every entry must trace to lens evidence. These are findability parameters, not campaign recommendations. Use the core's own vocabulary, not marketing-speak.

IN-MARKET BEHAVIOR:
Describe how the influential core behaves when actively considering a purchase or adoption decision in this category:
- researchPattern: how they research (sources consulted, in what order, how long)
- comparisonBehavior: how they compare options (criteria that matter, criteria they ignore, dealbreakers)
- decisionTriggers: what tips them from considering to acting
- postPurchaseBehavior: what they do after (review, share, advocate, gift, teach) — this is where core members become transmission engines
- Where the core's in-market behavior differs from the base's, use coreVsBase.

Ground every claim in lens evidence (community discussions of purchase decisions, review behavior, "should I buy" threads). If in-market evidence is thin, say so rather than inventing a journey.

TRUSTED VOICES:
Identify 4-8 voice archetypes the influential core actually trusts, ranked by trust weight. These are archetypes or named examples where evidence supports them (never invent named people):
- voice: the archetype ("the multi-year community regular with no commercial stake", "the local shop owner") or a named example if lens evidence specifically supports it
- whyTrusted: the trust mechanism — what earns this voice its credibility (2-3 sentences, evidence-based)
- proofFormats: what evidence formats this voice uses that land with the core (WIP posts, failure shares, granular product testimony, side-by-side comparisons)
- trustWeight: 0-100
- fragility: what would break this trust (1 sentence — e.g., "visible sponsorship without disclosure history")
Anti-confabulation applies fully: named individuals only when the lenses found them repeatedly and specifically.

REAL WORLD HABITAT:
From the lens evidence (realWorldContexts and reconciled real_world_context signals), describe where the influential core is influenced in real life — the offline mirror of the digital habitat. For each context:
- context: the place/setting ("local yarn stores", "craft nights", "workplace break rooms")
- influenceType: what happens there — "discovery" | "recommendation" | "demonstration" | "validation" | "gathering"
- description: how influence operates in this context (1-2 sentences)
- evidence: the dialogue patterns or findings that support it
- strength: 0-100, how significant this context is for the core

Only include contexts with real evidence. If offline evidence is thin, output fewer items and note it — do not pad with plausible-sounding contexts.

SIGNALS SNAPSHOT:
Produce an at-a-glance summary of the four Signals of Influence for the influential core. This is a DERIVED summary — every entry must be pulled from a scored section of your output, not newly written:

- motivational: from your emotional drivers — take the high scorers. label = driver name, detail = 2-6 word distillation of that driver's description, score = the driver's score
- behavioral: from your behavioral signals — take those rated high. label = short behavior phrase, rating = "HIGH"
- trust: from your influence susceptibility analysis — take the high-scoring subsets, and go one step deeper: name the specific means of influence ("failure sharing, zero-commercial-stake recommendations") or the specific type of trusted peer ("trusted bartenders"). label = channel, detail = the deeper specific, score included
- social: from your influence map, digital habitat, and real world habitat — take the top-scoring specific spaces, digital and offline together. label = the space, score included

3-5 entries per signal, ordered by score descending. Every entry must trace to an item in the full report — same name, same score. If a signal has fewer than 3 high-scoring items, show fewer rather than padding with low scorers. Include at least one real-world context in social when the real world habitat has a well-evidenced entry.

Also produce coreLabel: the name of the influential core archetype. This must be THE SAME archetype name used in your influential core definition/description (e.g., if the description says the core is "the multicraftual dabbler with established taste", coreLabel is exactly that). Do not write a new or alternative label — the snapshot and the Influential Core section must refer to the core by the same name.

SOCIAL SIGNALS — ENRICHMENT ONLY:
The reconciled data may contain a socialSignals list. If it does, reproduce it in your output. Do not re-score, re-place, add, or remove signals — the reconciliation agent owns selection, typing, scoring, and placement, and its ids, types, strength, strengthBasis, scale, scaleBasis, validatedBy, and evidence fields must pass through UNCHANGED. Your job is enrichment only:
- For each signal, fill targetableSignals with 2-4 entries: platform → the specific parameter someone would use to find or track this signal ("YouTube — trending interests, channel subscribers", "Google — trending keywords", "Reddit — subreddits, leading community voices", "Instagram — saves and sends, follower overlap"). Draw from your findability analysis and the signal's own evidence. These are findability parameters, not campaign recommendations. Only name platforms where this signal actually lives.
- You may lightly polish the body copy for report tone — meaning must not change.
If the reconciled data has no socialSignals, omit the field entirely.

CORE NAME:
Produce two fields inside influentialCore:
- coreName: a memorable NAME, 4 words maximum. It should feel like a title, not a description — interesting and actionable beats exhaustively correct. "The Pre-Whole-Foods Adopter" not "the experienced multi-craft peer who refuses to monetize". Capitalize as a title.
- coreTagline: one short sentence that completes the picture ("The one others text before buying a bottle.")
The existing coreLabel field continues to be produced for compatibility. The Signals Snapshot center circle now uses coreName.

OUTPUT FORMAT (respond with ONLY this valid JSON object — no prose, start with {):
{
  "summary": "2-3 sharp sentences on what moves this audience — the core behavioral truth and the lever, written for a strategist",

  "influentialCore": {
    "coreName": "a memorable NAME for the core, 4 words maximum — a title, not a description; interesting and actionable beats exhaustively correct ('The Pre-Whole-Foods Adopter', not 'the experienced multi-craft peer who refuses to monetize'). Capitalize as a title.",
    "coreTagline": "one short sentence that completes the picture ('The one others text before buying a bottle.')",
    "coreSizeEstimate": "the core's share of the audience as a short range ('8–15% of audience') ONLY when the reconciled data carries an estimatedProportion or equivalent evidence — omit otherwise",
    "definition": "narrative definition of the influential core for this audience",
    "profile": "psychographic detail on who the core is and how they differ from the broader audience",
    "keyBehaviors": ["behaviors that define the core"],
    "keyTensions": ["tensions the core navigates"],
    "languageCodes": ["language patterns that signal belonging"],
    "trustSignals": ["what makes something credible to the core"],
    "activationRecommendations": ["how a brand should engage the core"]
  },

  "influenceMap": [
    {
      "name": "influence space or voice name (from the reconciled data — never invent names)",
      "type": "initiator" | "amplifier" (initiator = originates behaviors/opinions others copy; amplifier = spreads and validates what initiators start),
      "platform": "primary platform or space where this influence operates",
      "intensityScore": number 1-100 (derive from the composite score: composite × 10, adjusted by confidence),
      "description": "what this influence is and why it matters — 1-2 sentences",
      "behavioralRole": "the psychological mechanism — how this influence moves the audience",
      "reach": "reach descriptor ONLY if present in the reconciled evidence — otherwise omit",
      "reachLevel": "micro" (known only within a tight niche, <10K people aware) | "niche" (recognized within the audience but not beyond, 10K-100K) | "significant" (crosses into adjacent audiences, 100K-1M) | "mainstream" (broadly known, >1M, shows up in mainstream media) — base this on lens evidence, not assumption; if reach can't be determined, default to "niche" rather than guessing high,
      "scores": {
        "composite": 1-10,
        "credibility": 1-10,
        "copyability": 1-10,
        "participationQuality": 1-10,
        "transmissionPower": 1-10,
        "bridgePotential": 1-10,
        "desireCreation": 1-10
      },
      "convergenceStatus": "converged" | "conflicted" | "single-lens",
      "conflictNotes": "if conflicted, what the lenses disagreed about (omit if not conflicted)",
      "confidence": "high" | "medium" | "directional" | "flagged",
      "sourceUrl": "URL if available",
      "unverified": false,
      "coreVsBase": { "core": "what's true of the core", "base": "what's true of the base" } (ONLY when evidenced — omit otherwise)
    }
  ],

  "entryPoints": [
    {
      "type": "one of: community (a specific group, forum, or community space to engage with) | channel (a distribution channel, content format, or media type) | voice (a specific type of person, creator, or voice to partner with or amplify) | moment (a temporal trigger, cultural moment, or life event to show up during) | context (a situational or environmental context where the audience is receptive) | ritual (a recurring behavior or routine to embed within)",
      "description": "what this entry point is and why it's recommended",
      "rationale": "which scored signals support this recommendation",
      "approach": "what a brand should do here — tone, format, content type",
      "avoid": "what NOT to do here",
      "confidence": "high" | "medium" | "directional",
      "examples": [
        {
          "title": "specific community, content, or moment from the reconciled data",
          "platform": "where it exists",
          "url": "URL from the reconciled data if available",
          "why": "what makes this an effective on-ramp",
          "unverified": true (only when no sourceUrl carried through)
        }
      ]
    }
  ],

  "digitalHabitat": [
    {
      "platform": "platform name",
      "community": "specific community/space name from the reconciled data",
      "engagementIntensity": number 1-100 (derive from influence density and scores in the reconciled data),
      "category": "forum" | "video" | "audio" | "social" | "newsletter" | "messaging",
      "description": "what role this space plays — is it discovery, validation, community, commerce?",
      "convergenceStatus": "converged" | "conflicted" | "single-lens",
      "sourceUrl": "URL if available"
    }
  ],

  "culturalDiscourse": [
    {
      "topic": "the conversation or cultural territory",
      "sentiment": "positive" | "negative" | "mixed" | "neutral",
      "tension": "the underlying tension driving this conversation",
      "actionSide": "the narrative that pushes people to act",
      "stuckSide": "the narrative that keeps people stuck",
      "source": "where this discourse lives",
      "direction": "accelerating" | "emerging" | "stable" | "fading",
      "convergenceStatus": "converged" | "conflicted" | "single-lens"
    }
  ],

  "emotionalDrivers": [
    {
      "emotion": "guilt" | "envy" | "pride" | "fomo" | "belonging" | "competition" | "fear" | "disgust" | "reward" | "scarcity",
      "score": number 1-100,
      "evidence": "the reconciled evidence for this emotion",
      "mechanism": "how this emotion drives behavior",
      "convergenceStatus": "converged" | "conflicted" | "single-lens",
      "coreVsBase": { "core": "...", "base": "..." } (ONLY when evidenced — omit otherwise)
    }
  ],

  "behavioralSignals": [
    {
      "category": "purchase" | "content" | "subscription" | "brand" | "habit",
      "signal": "what they do — short label",
      "intensity": "high" | "medium" | "low",
      "detail": "specific detail from the reconciled data",
      "trigger": "what causes this behavior",
      "convergenceStatus": "converged" | "conflicted" | "single-lens",
      "coreVsBase": { "core": "...", "base": "..." } (ONLY when evidenced — omit otherwise)
    }
  ],

  "influenceSusceptibility": {
    "overallScore": number 1-100 (how susceptible this audience is to influence overall),
    "initiatorScore": number 0-100 (100 = trendsetters, 0 = wait for full social proof),
    "channels": [
      {
        "channel": "peer" | "creator" | "brand" | "algorithm",
        "score": number 1-100,
        "description": "evidence-based description of how reliably this channel produces behavior change"
      }
    ],
    "highSusceptibility": ["types of influence they're most open to"],
    "lowSusceptibility": ["types of influence they resist or reject"],
    "trustTransferPaths": ["how trust moves — e.g., 'peer recommendation > expert endorsement > brand claim'"]
  },

  "culturalDepthCheck": [
    {
      "signal": "the cultural signal or trend being classified",
      "classification": "surface_trend" | "structural_force",
      "rationale": "evidence-based reasoning from the reconciled data",
      "timeframe": "projected lifespan if the reconciled data supports one"
    }
  ],

  "barriers": [
    {
      "name": "short label",
      "type": "practical" | "psychological" | "social" | "trust",
      "description": "what the barrier is and how it shows up (1-2 sentences)",
      "evidence": "where this was observed",
      "intensity": number 0-100,
      "implication": "what would lower this barrier (evidence-based, not a campaign idea)"
    }
  ],

  "findability": {
    "targetableInterests": ["5-10 interest/affinity categories in ad-platform terms"],
    "searchBehaviors": ["5-10 search terms/patterns the core actually uses"],
    "platformConcentrations": [
      { "platform": "platform name", "spaces": ["specific subreddits/hashtags/forums/niches"], "note": "how the core shows up here" }
    ],
    "affinityAdjacencies": [
      { "interest": "non-obvious overlap", "rationale": "the evidence for this affinity" }
    ]
  },

  "inMarketBehavior": {
    "researchPattern": "how the core researches — sources, order, duration",
    "comparisonBehavior": "how they compare — criteria that matter, criteria ignored, dealbreakers",
    "decisionTriggers": ["what tips them from considering to acting"],
    "postPurchaseBehavior": "what they do after — review, share, advocate, gift, teach",
    "coreVsBase": { "core": "...", "base": "..." } (ONLY when evidenced — omit otherwise)
  },

  "trustedVoices": [
    {
      "voice": "the archetype, or a named example ONLY when lens evidence specifically supports it",
      "whyTrusted": "the trust mechanism (2-3 sentences, evidence-based)",
      "proofFormats": ["evidence formats this voice uses that land with the core"],
      "trustWeight": number 0-100,
      "fragility": "what would break this trust (1 sentence)"
    }
  ],

  "realWorldHabitat": [
    {
      "context": "the place/setting",
      "influenceType": "discovery" | "recommendation" | "demonstration" | "validation" | "gathering",
      "description": "how influence operates in this context (1-2 sentences)",
      "evidence": "the dialogue patterns or findings that support it",
      "strength": number 0-100
    }
  ],

  "signalsSnapshot": {
    "coreLabel": "the EXACT archetype name used in influentialCore — not a paraphrase",
    "motivational": [{ "label": "driver name", "detail": "2-6 word distillation", "score": number }],
    "behavioral": [{ "label": "short behavior phrase", "rating": "HIGH" }],
    "trust": [{ "label": "channel", "detail": "the one-step-deeper specific", "score": number }],
    "social": [{ "label": "the specific space", "score": number }]
  },

  "socialSignals": [ (ONLY when the reconciled data contains socialSignals — reproduce each signal with all reconciliation fields UNCHANGED, filling only targetableSignals and optionally polishing body)
    {
      "id": "unchanged from reconciliation",
      "type": "unchanged", "signal": "unchanged", "where": "unchanged", "who": "unchanged",
      "body": "reconciliation's body, optionally polished for tone (meaning unchanged)",
      "strength": unchanged, "strengthBasis": "unchanged",
      "scale": "unchanged", "scaleBasis": "unchanged",
      "targetableSignals": [{ "platform": "platform this signal actually lives on", "detail": "the specific findability parameter" }],
      "validatedBy": unchanged, "evidence": "unchanged"
    }
  ],

  "researchDepth": {
    "totalSignalsScored": number (count of reconciledSignals),
    "highConfidenceFindings": number (signals with confidence "high"),
    "convergedFindings": number (signals with convergenceStatus "converged"),
    "conflictedFindings": number (signals with convergenceStatus "conflicted"),
    "singleLensFindings": number (signals with convergenceStatus "single-lens"),
    "lensesUsed": ["audience", "brand", "context"],
    "averageCompositeScore": number (mean of all composite scores, 1 decimal)
  },

  "sources": [
    {
      "url": "URL",
      "platform": "where it came from",
      "description": "source title or what this source is",
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
- Fill the researchDepth metrics accurately based on the actual reconciled data — count them, don't estimate.
- All 10 emotions in emotionalDrivers must be scored. Where the reconciled data shows little or no evidence for an emotion, give it a genuinely low score and say the evidence is limited — do not invent evidence.
- All 4 channels in influenceSusceptibility must be scored, grounded in the reconciled evidence.
- Scores must be genuinely differentiated — if everything clusters at 70-80, you have failed.
- influenceMap should contain 8-12 entries ranked by intensityScore descending, drawn from the strongest reconciled signals.`;
}

// ─── Periphery (Batch 4 — parallel with Synthesis) ───────────────────────────

export function buildPeripheryPrompt(inputs: AgentInputs, reconciledOutput: string): string {
  return `You are the Periphery Agent in the SWAY Influence Intelligence Engine. Your job is to map the adjacent audiences, interests, and subcultures that overlap with the audience being researched.

You receive the reconciled output from the three independent lens agents (Audience, Brand, Context). This gives you a comprehensive picture of who this audience is, what they care about, how they behave, and what influences them.

Your task: research what OTHER worlds these people inhabit beyond the primary interest being studied. What else do they care about? What adjacent communities do they participate in? What unexpected overlaps exist?

IMPORTANT: You are mapping adjacencies for the ENTIRE AUDIENCE — not just the influential core. The influential core is a subset that drives influence dynamics. The periphery map is about the broader audience's adjacent interests and overlapping identities.

For context, this is what "influential core" means wherever the reconciled data refers to it:

${CORE_DEFINITION}

INFLUENTIAL CORE FOCUS (adapted for adjacency mapping):
Your subject is the whole audience, but core-vs-base texture is valuable here too: where the evidence shows an adjacency belongs specifically to the influential core (early-adopter overlaps the base hasn't picked up yet) or specifically to the base (mainstream overlaps the core has moved past), say so in that adjacency's description or evidence. Do not manufacture the distinction where the evidence doesn't show it.

INPUTS:
${inputBlock(inputs)}

RECONCILED DATA:
${reconciledOutput}

RESEARCH STRATEGY (use up to 15 web searches):
Use web search to investigate:
1. What other subreddits, forums, YouTube channels, and social accounts are popular with this audience
2. What adjacent hobbies, interests, and lifestyle choices correlate with this audience
3. What media, entertainment, and content this audience consumes outside their primary interest
4. What values, causes, and worldview elements this audience shares
5. What brands, products, and categories this audience over-indexes on
6. Where this audience shows up that you wouldn't expect

Search for correlations, not assumptions. Look for actual evidence of overlap — shared community membership, cross-posting behavior, co-occurring interests in profiles and bios, audience overlap data from creators who span multiple niches.

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

ANTI-CONFABULATION RULES:
- Never fabricate overlap percentages. Use qualitative strength indicators (near-universal, strong, moderate, emerging) unless you find actual data.
- Never invent specific community names or creator names. Only cite what you find in search results.
- Source-pin every adjacency claim to what you actually found.
- Prefer "evidence suggests" over false precision.
- If you can't find evidence of an adjacency, don't include it.

OUTPUT FORMAT (respond with ONLY this valid JSON object — no prose, start with {):
{
  "peripheryMap": {
    "innerRing": [
      {
        "name": "string — the adjacent audience/interest/subculture",
        "segment": "mindset | lifestyle | interest | entertainment",
        "overlapStrength": "near-universal | strong",
        "description": "string — one sentence on what this adjacency looks like",
        "evidence": "string — what you found that supports this overlap"
      }
    ],
    "outerRing": [
      {
        "name": "string",
        "segment": "mindset | lifestyle | interest | entertainment",
        "overlapStrength": "moderate | emerging",
        "description": "string",
        "evidence": "string"
      }
    ]
  },
  "insights": {
    "surprisingOverlaps": [
      "string — non-obvious adjacencies that are strategically interesting"
    ],
    "bridgeOpportunities": [
      "string — where this audience connects to entirely different worlds"
    ],
    "expansionPaths": [
      {
        "direction": "string — the adjacent audience or space",
        "rationale": "string — why this is a viable expansion path",
        "risk": "string — what could go wrong (authenticity, dilution, etc.)"
      }
    ]
  },
  "culturalConnectors": [
    {
      "connector": "string — the archetype, space, format, or moment",
      "type": "voice | space | format | moment",
      "bridges": "string — from where → to where",
      "mechanism": "string — how influence travels across this bridge (1-2 sentences)",
      "evidence": "string — what supports this",
      "bridgeStrength": number 0-100
    }
  ]
}

Aim for 4-6 items in the inner ring and 6-10 in the outer ring. Quality over quantity — each item should be evidence-backed. Spread items across all four segments (mindset, lifestyle, interest, entertainment) where the evidence supports it.`;
}
