export interface SectionInfo {
  title: string;
  description: string;
  methodology: string;
  scoring?: string;
}

export const SECTION_INFO: Record<string, SectionInfo> = {
  influentialCore: {
    title: "The Influential Core",
    description:
      "The early adopters of a mindset or behavior — the real people within the audience who disproportionately influence what others believe, adopt, and share. They're not defined by follower counts or platform reach: they're early, trusted, esteemed through demonstrated experience, and open about what they do — which is what makes their behavior copyable. Their influence moves through networks and communities, not broadcast.",
    methodology:
      "Synthesized from three independent research lenses — audience, brand, and market context — that each researched this audience separately, followed by a reconciliation step that identified where the lenses converged and conflicted about who the core is. Convergence across independent research paths is what gives this definition structural credibility.",
  },

  influenceMap: {
    title: "Influence Map",
    description:
      "Identifies the specific creators, public figures, brands, and voices that have outsized sway over this archetype's decisions, beliefs, and behaviors. These are the people and entities this audience actively listens to, follows, and trusts.",
    methodology:
      "Built by searching for who this community references, quotes, recommends, and debates across Reddit, YouTube, social media, forums, and cultural commentary. We look at who is cited when community members make decisions, who gets credit for trends, and who faces backlash when they shift positions.",
    scoring:
      "Influence Intensity (1–100) reflects the degree to which this voice shapes community behavior — not just reach. A niche creator with 50K followers who genuinely moves purchasing decisions will score higher than a celebrity with 10M followers who this audience ignores. Scores are derived from: frequency of mentions, emotional weight of those mentions, evidence of behavior change, and whether the audience defends or critiques them. Initiators are the 5–10% who set trends first; amplifiers spread what initiators start.",
  },

  digitalHabitat: {
    title: "Digital Habitat",
    description:
      "Maps where this archetype actually spends time online — the specific communities, platforms, and spaces where they gather, talk, consume content, and form opinions. These are the places where cultural meaning is made for this audience.",
    methodology:
      "Identified through cross-referencing community membership data, content consumption patterns, and platform-specific discourse analysis. We look for communities where this archetype is the primary audience — not just places they occasionally visit.",
    scoring:
      "Engagement Intensity (1–100) measures how central each space is to this archetype's identity and daily behavior. A community scores high if: members post frequently rather than just lurk, it's referenced in other communities, it has dedicated vocabulary or inside knowledge, and members report strong emotional investment. A subreddit where people check in daily and form real relationships scores higher than a Facebook group that mostly shares memes.",
  },

  culturalDiscourse: {
    title: "Cultural Discourse",
    description:
      "Surfaces the real conversations, debates, tensions, and obsessions happening within this archetype's communities right now. This is what they are actually talking about — not what marketers assume they care about.",
    methodology:
      "Pulled from active threads, comment sections, forum posts, and social media discourse. We look for recurring topics, emotionally charged debates, and the language patterns that reveal what this audience truly values and fears. Example quotes are representative of real community voice and tone.",
    scoring:
      "Sentiment (positive/negative/mixed/neutral) reflects the emotional valence of the community's relationship with each topic. 'Mixed' typically indicates a tension point — something the audience is actively wrestling with, which often represents the highest opportunity for brands to engage authentically.",
  },

  emotionalDrivers: {
    title: "Emotional Driver Dashboard",
    description:
      "Scores the intensity of 10 core emotional forces operating within this archetype's community. These are the underlying psychological currents that drive behavior — what people feel but don't always say explicitly.",
    methodology:
      "Each emotion is scored by analyzing the frequency, intensity, and context of emotionally-coded language in community discourse. We look at what triggers reactions, what topics generate the most engagement, and what anxieties surface repeatedly in conversation.",
    scoring:
      "Each emotion is scored 1–100 based on prevalence and intensity in detected discourse. 80–100 = dominant driver, visible in most interactions. 60–79 = strong presence, surfaces regularly. 40–59 = moderate, present but not defining. 20–39 = low, occasionally detectable. 1–19 = trace, rarely surfaces. Scores are calibrated relative to each other — if everything scored 70, the model has failed. Genuine variance reflects the actual emotional texture of this community.",
  },

  behavioralSignals: {
    title: "Behaviors and Triggers",
    description:
      "Documents what this archetype is actually doing — their purchasing patterns, content consumption habits, subscription behaviors, brand loyalties, and lifestyle practices. This is behavior, not attitude.",
    methodology:
      "Sourced from community discussions about purchases, brand mentions, product reviews, subscription recommendations, and lifestyle habits. We look for what people report buying, what they ask for recommendations on, and what they tell others to avoid.",
    scoring:
      "Intensity (High/Medium/Low) reflects how consistently and broadly this behavior appears across the archetype. High = near-universal behavior, mentioned constantly across multiple communities. Medium = common but not defining. Low = present in a segment of the archetype, worth noting but not dominant.",
  },

  influenceSusceptibility: {
    title: "Influence Susceptibility Profile",
    description:
      "Measures how open this archetype is to being influenced, and which channels of influence work hardest on them. This helps identify where and how to engage them — and where outreach will be ignored.",
    methodology:
      "Built by analyzing how this community talks about discovering things: do they credit friends, algorithms, creators, or brands? How do they respond to advertising? Do they pride themselves on being ahead of trends or do they wait for social proof? Do they distrust institutional recommendations?",
    scoring:
      "Overall Susceptibility (1–100): how open this archetype is to external influence in general. High scores indicate they actively seek recommendations and trust outside voices. Low scores suggest a skeptical, self-directed audience that resists overt influence. Initiator Score (0–100): where this archetype sits on the trendsetter-to-follower spectrum. 70+ = early adopters and taste-makers. 40–69 = middle majority. Below 40 = late adopters who wait for full social proof. Channel scores (1–100) show which influence type lands hardest — peer recommendations, creator endorsements, brand messaging, or algorithmic discovery.",
  },

  researchTrail: {
    title: "Research Trail",
    description:
      "Shows the sources and communities the agents drew from when building this report. This is the methodology layer — transparency into how the intelligence was gathered, not what it found.",
    methodology:
      "Every source the agents consulted during their web research is logged here. Sources are grouped by platform type: community forums (Reddit, Discord) where people talk candidly, creator channels (YouTube, podcasts) where behavior is modeled, and institutional sources (publications, research) that add structural context. The source count and platform mix tell you how broad and balanced the research was for this specific archetype.",
  },

  sourceRanking: {
    title: "Top Signal Sources",
    description:
      "Ranks the communities and channels that provided the most behavioral insight for this specific archetype. Signal strength reflects usefulness for understanding this audience — not size or popularity of the source in general.",
    methodology:
      "Signal strength is rated 1–100 based on how much actionable behavioral data the agent extracted from each source: frequency of relevant discussions, specificity of community vocabulary, evidence of decision-making and behavior change, and how central the community is to this archetype's identity. A niche subreddit with 10K members where people post weekly purchase decisions will rank higher than a 2M-member group with low-quality discourse.",
    scoring:
      "80–100 = primary signal source, central to understanding this archetype. 60–79 = strong secondary source with meaningful behavioral data. 40–59 = supplementary source, useful for context. Below 40 = limited signal, included for completeness.",
  },

  barriers: {
    title: "Barriers & Frictions",
    description:
      "What prevents the influential core from acting — adopting, buying, participating, or advocating. The missing half of the motivational picture: emotional drivers explain why they act, barriers explain why they don't.",
    methodology:
      "Surfaced from community discussions, review patterns, and lens findings where core members describe hesitation, abandonment, or frustration. Each barrier is typed (practical, psychological, social, or trust) and paired with the evidence-based condition that would lower it — not a campaign idea.",
    scoring:
      "Blocking Intensity (0–100) reflects how strongly each barrier prevents action based on how frequently and emphatically it appears in the core's own discussions.",
  },

  findability: {
    title: "Findability",
    description:
      "The targeting profile for the influential core — the practical parameters someone would use to find and reach them: ad-platform interest categories, the search terms they actually use, the specific platform corners they concentrate in, and non-obvious affinity overlaps.",
    methodology:
      "Every entry traces to lens evidence, expressed in the core's own vocabulary rather than marketing-speak. Insider search terms come from the language codes research; platform concentrations name specific spaces (subreddits, hashtags, forums), not generic platforms. These are findability parameters, not campaign recommendations.",
  },

  inMarketBehavior: {
    title: "In-Market Behavior",
    description:
      "How the influential core behaves when actively considering a purchase or adoption decision: how they research, how they compare options, what tips them into acting, and what they do afterward — the post-purchase moment is where core members become transmission engines.",
    methodology:
      "Grounded in community discussions of purchase decisions, review behavior, and 'should I buy' threads read by the lens agents. Where in-market evidence was thin, the section says so rather than inventing a journey.",
  },

  trustedVoices: {
    title: "Trusted Voices",
    description:
      "The voice archetypes the influential core actually believes, ranked by trust weight — with the trust mechanism behind each, the proof formats that land, and what would break the trust.",
    methodology:
      "Archetypes are derived from patterns in who the core defers to across community discussions. Named individuals appear only when the lenses found them cited repeatedly and specifically as peer-trusted — never because they're big. Fragility notes capture the conditions under which each voice's credibility would collapse.",
    scoring:
      "Trust Weight (0–100) reflects how consistently and strongly the core defers to this voice type in observed discussions.",
  },

  realWorldHabitat: {
    title: "Real World Habitat",
    description:
      "The offline mirror of the digital habitat: the in-real-life places and gatherings where influence actually happens — shops, clubs, workplaces, classes, events. People reveal these contexts constantly in how they talk online ('my local shop recommended…', 'someone at craft night showed me…').",
    methodology:
      "Collected only from real dialogue patterns and documented behavior found by the lens agents — never guessed from plausibility. Offline evidence is rarer than digital evidence, so a short well-evidenced list beats a long speculative one; when offline evidence was thin, this section is deliberately short.",
    scoring:
      "Influence Strength (0–100) reflects how significant each context is for the core, based on how often and how centrally it appears in the evidence.",
  },

  signalsSnapshot: {
    title: "Signals Snapshot",
    description:
      "The four Signals of Influence at a glance — the influential core at the center, surrounded by its top motivational, behavioral, trust, and social signals. Built for readers who won't go deep into the tabs.",
    methodology:
      "Every entry is derived, not invented: pulled from a scored section of the full report, carrying the same name and score. Motivational entries come from the Emotional Driver Dashboard, behavioral from Behaviors and Triggers, trust from Influence Susceptibility (one step deeper — the specific means of influence or type of trusted peer), and social from the Influence Map, Digital Habitat, and Real World Habitat together.",
  },

  signalCheck: {
    title: "Signal Check",
    description:
      "Quantitative validation of the report's findings using live platform data — Google Trends, Reddit, YouTube, and Pinterest. The reconciliation agent reads the three lens analyses, identifies the claims that most need quantitative backing, and makes targeted API lookups (up to 8 per report).",
    methodology:
      "Every number shown is exactly what the platform API returned — never estimated or extrapolated. Each signal is tagged with the Signal of Influence it validates and names the specific lens claim it confirms or challenges. Calls are prioritized toward claims where lenses disagreed, quantifiable claims (community size, trend direction, creator reach), and claims central to the influential core.",
  },

  culturalConnectors: {
    title: "Cultural Connectors",
    description:
      "The bridges that carry influence between the influential core and adjacent communities or broader culture — the voices, spaces, formats, and moments through which ideas actually cross the boundaries the Adjacency Map draws.",
    methodology:
      "Observed bridges only, not suggested partners: each connector is backed by lens findings, adjacency research, or documented behavior, drawing on the reconciled bridge-potential scores and trust transfer paths. Named individuals appear only with repeated, specific evidence — archetypes are usually the right level.",
    scoring:
      "Bridge Strength (0–100) reflects how much influence actually travels across this bridge based on the observed evidence.",
  },

  influenceQuadrant: {
    title: "Influence Quadrant",
    description:
      "Plots every influence in the map on two dimensions: how broadly known it is (reach) and how strong its scored influence is (composite score). The top-left zone — high influence, low reach — is the Hidden Core: the under-priced influences most brands miss because they optimize for reach.",
    methodology:
      "Reach level is assessed categorically (micro → niche → significant → mainstream) from the reconciled lens evidence. The composite score comes from the reconciliation agent's six-dimension scoring model. Dot styling shows convergence: solid = found by multiple lenses independently, outlined = lenses disagreed, muted = single-lens finding.",
    scoring:
      "The Obvious (high reach + high score): real influence everyone can see — expensive and crowded. The Hidden Core (low reach + high score): concentrated influence with low visibility — the highest-value engagement zone. The Noise (high reach + low score): visibility without behavioral influence. The Periphery (low reach + low score): weak signals worth monitoring.",
  },

  activationPlaybook: {
    title: "Activation Recommendations",
    description:
      "Concrete recommendations for how a brand should engage this audience's influential core — tone, formats, channels, and behaviors that build credibility rather than triggering rejection.",
    methodology:
      "Derived from the synthesis of all three research lenses: what the audience lens found about trust architecture, what the brand lens found about approaches that work and backfire, and what the context lens found about timing. Recommendations prioritize findings that converged across lenses.",
  },

  entryPoints: {
    title: "Entry Points",
    description:
      "Identifies the specific doors people walk through when first entering this behavior or mindset space. These are the catalysts, media, communities, and experiences that initiate someone into this archetype's world — before they become a full member of it.",
    methodology:
      "Built by researching what people cite as their 'origin story' for adopting this lifestyle or mindset — the first YouTube video, subreddit, podcast, or product that kicked things off. We look for recurring entry patterns across community discussions, 'how I got into this' threads, and beginner recommendation posts.",
  },

  culturalDepthCheck: {
    title: "Cultural Depth Check",
    description:
      "Classifies each major signal detected in this archetype's world as either a Surface Trend (fleeting, aesthetic-driven, likely to fade) or a Structural Force (enduring, values-driven, reshaping behavior for years). This is the difference between a moment and a movement.",
    methodology:
      "Each signal is evaluated against: how long it has been present in discourse, whether it is driven by aesthetics and novelty or by deeper values and necessity, what similar historical patterns looked like, and whether experts and cultural analysts treat it as a passing phase or a genuine shift.",
    scoring:
      "Surface Trend: driven by novelty, aesthetics, or social contagion. Likely 1–3 year lifespan. Brands should engage tactically and quickly, without over-investing. Structural Force: rooted in values, economics, or demographic change. Likely 5–20 year trajectory. Brands should build strategy around it, not just campaign tactics. The distinction matters because brands that treat structural forces as trends miss transformational opportunities — and brands that treat trends as structural forces over-invest in things that disappear.",
  },
};
