export interface SectionInfo {
  title: string;
  description: string;
  methodology: string;
  scoring?: string;
}

export const SECTION_INFO: Record<string, SectionInfo> = {
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
    title: "Behavioral Signals",
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

  funnelView: {
    title: "Purchase Funnel View",
    description:
      "Reorganizes the report's findings by where they apply in the decision journey. Instead of viewing influences, emotions, and behaviors separately, this view shows what forces are operating at each stage from first exposure to long-term retention.",
    methodology:
      "Each influencer, emotional driver, and behavioral signal in the report was tagged by which funnel stages it most powerfully activates. Tagging was done by the research agents based on behavioral evidence — not assumed from category. An item can appear in multiple stages if evidence supports it.",
    scoring:
      "Awareness: forces that create first exposure or recognition. Consideration: forces that drive evaluation and comparison. Conversion: forces that push from intent to action. Retention: forces that sustain loyalty and repeat behavior. Stages with more items represent where this archetype's decision-making is most complex or influenced.",
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
