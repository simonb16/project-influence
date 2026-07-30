# SWAY Round 4: Influential Core Rigor + Signal Depth
## Claude Code Brief

---

## Build Summary

| | |
|---|---|
| **What changes** | Agent prompts (core rigor), new synthesis outputs, 4 new UI sections, 1 section move, new Tab 1 summary visual |
| **What doesn't change** | Agent count (6), pipeline shape (3-1-1-1), search limits (15/25), input form, localStorage schema |
| **New sections** | Barriers & Frictions (Motivational) · Findability (Behavioral) · In-Market Behavior (Behavioral) · Trusted Voices (Trust) · Real World Habitat (Social) · Signals Snapshot (Tab 1) |
| **Moved** | Trust Transfer Paths: Tab 1 → Trust tab |
| **New types** | `coreVsBase` notes, `barriers`, `findability`, `inMarketBehavior`, `trustedVoices`, `realWorldHabitat`, `signalsSnapshot` |
| **Backward compatible** | Yes — new sections render only when data is present |

---

## What This Round Does

Two things:

1. **Influential core rigor.** Every output downstream of reconciliation must describe the influential core specifically — not the broader growth audience. Where the core and the base differ, that difference gets called out explicitly.
2. **Signal depth.** Fill the gaps in the four Signals of Influence: add Barriers & Frictions (Motivational), Findability and In-Market Behavior (Behavioral), and Trusted Voices (Trust). Plus a Signals Snapshot visual on Tab 1 for readers who won't go deep.

**Explicitly out of scope:** Do NOT add content territory, partnership, or brand experience recommendations. Sway's job is to surface the evidence that informs those decisions — the strategy layer is done by humans. Keep all new outputs evidence-side.

---

## Part 1: Influential Core Rigor Pass

### The problem — two parts

1. **The definition itself is incomplete.** The current definition in the prompts (from Round 1) describes the core as "the most socially active part of this audience" whose behaviors are "copied, discussed, and trusted." That's directionally right but has gaps: it never says *early adopter*, it doesn't explicitly exclude follower-count influencers, and "most socially active" risks steering lens agents toward the most *visible* posters — influencers and content creators — who are exactly who web search surfaces easiest.
2. **The focus drifts downstream.** The lenses research the growth audience broadly (correct — the core has to be discovered from the full picture). But downstream outputs — trust signals, emotional drivers, entry points, behavioral signals — sometimes describe the whole audience rather than the core specifically. The report's promise is "here's the influential core and what moves THEM."

### Fix 1 — replace the definition everywhere

Find every place the influential core is defined or described in `src/lib/prompt.ts` (all lens agents, reconciliation, synthesis, periphery) and replace with this canonical definition:

```
THE INFLUENTIAL CORE — CANONICAL DEFINITION:
The influential core are the early adopters of a mindset or behavior — the real people within the audience who disproportionately influence what others believe, adopt, and share.

They are NOT defined by follower counts, content creation, or platform reach. A person with 200 followers who their knitting circle, subreddit, or friend group actually consults before buying is core. A creator with 500K followers whose endorsements are viewed as sponsored noise is not.

What defines them:
1. EARLY — they try, adopt, and form opinions before the rest of the audience
2. TRUSTED — others in their networks and communities actively seek and follow their judgment
3. ESTEEMED — they hold standing earned through demonstrated experience, not self-promotion
4. OPEN — they are visible and candid about what they do, use, and think, which is what makes their behavior copyable

Their influence operates through networks and communities — neighbors, co-workers, forum regulars, group members — not through broadcast. Creators and influencers CAN belong to the core, but only when the evidence shows they are trusted as peers rather than followed as media.

RESEARCH IMPLICATION: The core is harder to find via web search than influencers are, because influencers optimize for visibility and the core doesn't. Look for them in the places influence actually shows up: highly-upvoted community answers, "who do you ask before buying" threads, repeated peer references to the same kind of person, comment sections where someone's judgment is deferred to. Do not default to creator round-ups and follower metrics.
```

The `RESEARCH IMPLICATION` paragraph goes to the three lens agents only (it's a research instruction). The rest goes everywhere the definition appears.

### Fix 2 — core focus downstream (prompt changes only)

Add this block to the **Reconciliation, Synthesis, and Periphery agent prompts** (adapted to each agent's context):

```
INFLUENTIAL CORE FOCUS:
Once the influential core has been defined, every output you produce describes the INFLUENTIAL CORE — not the broader growth audience. Trust signals are what the CORE trusts. Emotional drivers are what drives the CORE. Entry points are where to reach the CORE. Behaviors are what the CORE does.

The broader audience is context, not subject. Use it in two ways only:
1. To explain how the core differs from the base — these contrasts are strategically valuable. When you know a core-vs-base difference, state it explicitly ("the core buys premium indie by default while the base is coupon-literate").
2. To describe how influence flows FROM the core TO the base (transmission, copying, trust transfer).

If evidence only supports a claim about the broader audience and you cannot tell whether it holds for the core specifically, either omit it or label it: "broad-audience signal, core-specific evidence not found."
```

### Structured core-vs-base contrasts

Add an optional `coreVsBase` field to the major output items (influence items, emotional drivers, behavioral items, trust signals):

```typescript
interface CoreVsBaseNote {
  core: string;   // what's true of the influential core
  base: string;   // what's true of the broader audience
}
// e.g. { core: "Buys premium indie yarn by default — a values behavior",
//        base: "Coupon-literate, shops its own stash under price pressure" }
```

Add to the synthesis prompt:

```
Where the lenses surfaced a meaningful difference between the influential core and the broader audience on an item, populate coreVsBase. Only include it when there's real evidence of a difference — do not manufacture contrasts.
```

**UI:** where `coreVsBase` is present, render a small two-line contrast under the item ("CORE: … / BASE: …", muted styling). Absent = render nothing.

---

## Part 2: Barriers & Frictions (Motivational Tab)

The missing half of Emotional Drivers: what motivates the core is covered, what *prevents them from acting* is not.

### Synthesis prompt addition

```
BARRIERS & FRICTIONS:
Identify 4-8 barriers that prevent the influential core from acting — adopting, buying, participating, advocating. For each:
- name: short label
- type: one of "practical" (cost, time, access), "psychological" (fear, identity conflict, imposter feelings), "social" (community norms, judgment risk), "trust" (skepticism, past burns, credibility gaps)
- description: what the barrier is and how it shows up (1-2 sentences)
- evidence: where this was observed (community discussions, review patterns, lens findings)
- intensity: 0-100, how strongly this blocks action
- implication: what would lower this barrier (evidence-based, not a campaign idea)
```

### Type

```typescript
interface Barrier {
  name: string;
  type: 'practical' | 'psychological' | 'social' | 'trust';
  description: string;
  evidence: string;
  intensity: number; // 0-100
  implication: string;
}
```

### UI

New section on the **Motivational tab, below Emotional Drivers / Key Tensions**. Header: "BARRIERS & FRICTIONS", subheading "What prevents the core from acting." Style consistent with the Emotional Driver Dashboard — intensity bars work well here too, with the type as a small badge.

---

## Part 3: Findability (Behavioral Tab)

Answers: "What targetable interests, behaviors, searches and affinities can help us find them?" This is the bridge from insight to media planning.

### Synthesis prompt addition

```
FINDABILITY:
Produce the targeting profile for the influential core — the practical parameters someone would use to find and reach them:
- targetableInterests: 5-10 interest/affinity categories as they'd appear in ad platforms (e.g., "indie yarn dyeing", "visible mending", "cosy gaming")
- searchBehaviors: 5-10 search terms/patterns the core actually uses (draw from language codes and lens evidence — insider vocabulary is targeting gold)
- platformConcentrations: where the core over-indexes, with the specific spaces (subreddits, hashtags, forum names, YouTube niches) — not just "Instagram" but the specific corners
- affinityAdjacencies: 3-6 non-obvious interest overlaps usable for lookalike or affinity targeting (draw from periphery/adjacency data)

Rules: every entry must trace to lens evidence. These are findability parameters, not campaign recommendations. Use the core's own vocabulary, not marketing-speak.
```

### Type

```typescript
interface Findability {
  targetableInterests: string[];
  searchBehaviors: string[];
  platformConcentrations: Array<{ platform: string; spaces: string[]; note: string }>;
  affinityAdjacencies: Array<{ interest: string; rationale: string }>;
}
```

### UI

New section on the **Behavioral tab, below Entry Points**. Header: "FINDABILITY", subheading "Targetable signals for reaching the core." Render as compact tag/chip groups with the four sub-groups labeled. This section is deliberately scannable — it's a reference block, not a narrative.

---

## Part 4: In-Market Behavior (Behavioral Tab)

Answers: "How do they research, compare, choose and behave in-market?"

### Synthesis prompt addition

```
IN-MARKET BEHAVIOR:
Describe how the influential core behaves when actively considering a purchase or adoption decision in this category:
- researchPattern: how they research (sources consulted, in what order, how long)
- comparisonBehavior: how they compare options (criteria that matter, criteria they ignore, dealbreakers)
- decisionTriggers: what tips them from considering to acting
- postPurchaseBehavior: what they do after (review, share, advocate, gift, teach) — this is where core members become transmission engines
- Where the core's in-market behavior differs from the base's, use coreVsBase.

Ground every claim in lens evidence (community discussions of purchase decisions, review behavior, "should I buy" threads). If in-market evidence is thin, say so rather than inventing a journey.
```

### Type

```typescript
interface InMarketBehavior {
  researchPattern: string;
  comparisonBehavior: string;
  decisionTriggers: string[];
  postPurchaseBehavior: string;
  coreVsBase?: CoreVsBaseNote;
}
```

### UI

New section on the **Behavioral tab, below Findability**. Header: "IN-MARKET BEHAVIOR", subheading "How the core researches, compares and chooses." Four labeled blocks of prose, decision triggers as a short list.

---

## Part 5: Trusted Voices + Trust Transfer Paths Move (Trust Tab)

The Trust tab currently has one section. This gives it real depth.

### 5a. Trusted Voices

#### Synthesis prompt addition

```
TRUSTED VOICES:
Identify 4-8 voice archetypes the influential core actually trusts, ranked by trust weight. These are archetypes or named examples where evidence supports them (never invent named people):
- voice: the archetype ("the multi-year community regular with no commercial stake", "the local shop owner") or a named example if lens evidence specifically supports it
- whyTrusted: the trust mechanism — what earns this voice its credibility (2-3 sentences, evidence-based)
- proofFormats: what evidence formats this voice uses that land with the core (WIP posts, failure shares, granular product testimony, side-by-side comparisons)
- trustWeight: 0-100
- fragility: what would break this trust (1 sentence — e.g., "visible sponsorship without disclosure history")
Anti-confabulation applies fully: named individuals only when the lenses found them repeatedly and specifically.
```

#### Type

```typescript
interface TrustedVoice {
  voice: string;
  whyTrusted: string;
  proofFormats: string[];
  trustWeight: number; // 0-100
  fragility: string;
}
```

#### UI

On the **Trust tab, below Trust Signals**. Header: "TRUSTED VOICES", subheading "Who the core believes, and why." Ranked cards with trust weight bars; fragility as a muted footnote line per card.

### 5b. Move Trust Transfer Paths

Trust Transfer Paths currently renders on Tab 1 (The Influential Core). Move it to the **Trust tab, below Trusted Voices**. It's the flow diagram of how trust moves — it belongs with the trust content. UI move only, no data changes.

---

## Part 6: Real World Habitat (Social Tab)

Digital Habitat describes where the core lives online. Real World Habitat is its offline mirror: the in-real-life communities, places, and gatherings where influence actually happens — craft nights, local shops, guilds, workplaces, bars, gyms, church groups, tailgates, farmers markets, classes.

### Why this is findable

The lens agents read actual community dialogue, and people constantly reveal offline influence contexts in how they talk: "my LYS recommended...", "someone at craft night showed me...", "my coworker got me into...", "the bartender suggested...". The evidence is in the conversations the lenses already read — they just need to be told to collect it.

### Lens agent prompt addition (all three lenses)

```
REAL WORLD INFLUENCE CONTEXTS:
As you read community discussions, actively collect evidence of WHERE influence happens offline. People reveal this in passing: "my local yarn store recommended", "someone at the meetup showed me", "my sister-in-law got me into", "the guy at the shop said". Note:
- The physical/social context (shop, club, workplace, event, family gathering, class)
- What kind of influence happens there (discovery, recommendation, demonstration, validation)
- The evidence — the actual dialogue patterns that revealed it

Do not guess at plausible offline contexts. Only report contexts that appear in real dialogue or documented behavior. Offline influence evidence is rarer than digital evidence — a few well-evidenced contexts beat a long speculative list.
```

### Synthesis prompt addition

```
REAL WORLD HABITAT:
From the lens evidence, describe where the influential core is influenced in real life — the offline mirror of the digital habitat. For each context:
- context: the place/setting ("local yarn stores", "craft nights", "workplace break rooms")
- influenceType: what happens there — "discovery" | "recommendation" | "demonstration" | "validation" | "gathering"
- description: how influence operates in this context (1-2 sentences)
- evidence: the dialogue patterns or findings that support it
- strength: 0-100, how significant this context is for the core

Only include contexts with real evidence. If offline evidence is thin, output fewer items and note it — do not pad with plausible-sounding contexts.
```

### Type

```typescript
interface RealWorldHabitatItem {
  context: string;
  influenceType: 'discovery' | 'recommendation' | 'demonstration' | 'validation' | 'gathering';
  description: string;
  evidence: string;
  strength: number; // 0-100
}
```

### UI

New section on the **Social tab, directly below Digital Habitat**. Header: "REAL WORLD HABITAT", subheading "Where the core is influenced offline." Mirror the Digital Habitat styling so they read as a pair. Order by strength descending.

---

## Part 7: Signals Snapshot (Tab 1)

A one-glance visual summary of the four signals, for readers who won't go deep into the tabs. Mirrors Maria's reference slide: the influential core circle at center, the four signal boxes around it.

**Key principle: the snapshot is DERIVED, not invented.** Every entry is pulled from a specific scored section of the report, carries that section's score where available, and goes one step deeper than a bare label. Bullets within each box are ordered by score, highest first.

### Where each box pulls from

**MOTIVATIONAL — from the Emotional Driver Dashboard.**
Take the high-scoring emotional drivers. Each entry: the driver name, plus a one-step-deeper distillation of what that driver specifically means for this core, plus the score.
Format: `Belonging — community without judgment · 92`
The distillation comes from the driver's existing description in the dashboard — compressed to 2-6 words, not newly invented.

**BEHAVIORAL — from Behaviors and Triggers (Behavioral tab).**
Take the behaviors rated "high". Each entry: the behavior in short form, with its rating or score.
Format: `Gifting 'the good bottle' · HIGH`
Ordered by score/intensity, highest first.

**TRUST — from Influence Susceptibility.**
Take the susceptibility channels/subsets that scored high, and go one step deeper using the detail in that section: specify the *means* of influence or the *type* of trusted peer, not just the channel name. Both are valid when evidenced:
Format: `Peer influence — failure sharing, zero-commercial-stake recommendations · 87`
Or: `Peer influence — trusted bartenders · 82`
Include the score. Only include subsets that scored high. Ordered by score.

**SOCIAL — from the Influence Map, Digital Habitat, and Real World Habitat (Part 6).**
Take the top-scoring communities/spaces across all three sources — digital and real-world together. Each entry: the specific space in short form, with its score where the source has one.
Format: `r/pelotoncycle · 8.4` · `Local craft nights · 78`
Include at least one real-world context when the Real World Habitat has a well-evidenced entry — the offline dimension is part of the point of this snapshot.

### Synthesis prompt addition

```
SIGNALS SNAPSHOT:
Produce an at-a-glance summary of the four Signals of Influence for the influential core. This is a DERIVED summary — every entry must be pulled from a scored section of your output, not newly written:

- motivational: from your emotional drivers — take the high scorers. label = driver name, detail = 2-6 word distillation of that driver's description, score = the driver's score
- behavioral: from your behavioral signals — take those rated high. label = short behavior phrase, score/rating included
- trust: from your influence susceptibility analysis — take the high-scoring subsets, and go one step deeper: name the specific means of influence ("failure sharing, zero-commercial-stake recommendations") or the specific type of trusted peer ("trusted bartenders"). label = channel, detail = the deeper specific, score included
- social: from your influence map, digital habitat, and real world habitat — take the top-scoring specific spaces, digital and offline together. label = the space, score included

3-5 entries per signal, ordered by score descending. Every entry must trace to an item in the full report — same name, same score. If a signal has fewer than 3 high-scoring items, show fewer rather than padding with low scorers.

Also produce coreLabel: the name of the influential core archetype. This must be THE SAME archetype name used in your influential core definition/description (e.g., if the description says the core is "the multicraftual dabbler with established taste", coreLabel is exactly that). Do not write a new or alternative label — the snapshot and the Influential Core section must refer to the core by the same name.
```

### Type

```typescript
interface SnapshotEntry {
  label: string;        // "Belonging", "Peer influence", "r/pelotoncycle"
  detail?: string;      // "community without judgment", "trusted bartenders" — the one-step-deeper specific
  score?: number;       // numeric score where the source section has one
  rating?: string;      // "HIGH" where the source uses ratings instead of numbers
}

interface SignalsSnapshot {
  coreLabel: string;
  motivational: SnapshotEntry[]; // 3-5 each, ordered by score descending
  behavioral: SnapshotEntry[];
  trust: SnapshotEntry[];
  social: SnapshotEntry[];
}
```

### UI — new component `SignalsSnapshot.tsx`

- Renders on **Tab 1, directly below the Influential Core description** (before Influence Susceptibility)
- Layout mirrors the reference: central circle with the core label ("INFLUENTIAL CORE" + coreLabel), four boxes at the corners — MOTIVATIONAL (top-left), BEHAVIORAL (top-right), TRUST (bottom-left), SOCIAL (bottom-right) — each with its entries
- Entry rendering: `{label} — {detail} · {score}` with the score in the accent color; omit the em-dash segment when there's no detail, omit the score segment when there's none
- Entries ordered by score descending within each box
- A faint outer ring labeled "GROWTH AUDIENCE" around the core circle reinforces the core-within-audience concept
- Dark theme, consistent with the design system; the four box labels in the accent color
- Each box is clickable → navigates to the corresponding signal tab
- Responsive: on narrow viewports, stack as core circle on top, then the four boxes in a 2x2 or single-column grid
- Renders only when `signalsSnapshot` is present in the data

---

## Part 8: Backward Compatibility

- All new fields are optional. Old reports without them render exactly as they do today — new sections and the snapshot simply don't appear. No errors, no empty placeholders.
- Trust Transfer Paths move: if a report has the data, it now renders on the Trust tab instead of Tab 1. Same component, new location.
- No changes to localStorage read/write, no renames of existing JSON keys.

---

## What NOT to Change

- Agent count (6), pipeline shape (3-1-1-1), batches, models
- Search limits — 15 per lens, 25 Periphery
- Input form
- Anti-confabulation rules — they apply fully to all new outputs, especially Trusted Voices
- Existing sections' content and styling (other than the Trust Transfer Paths move)
- **No recommendation-layer outputs** — no content territories, partnership suggestions, or campaign ideas anywhere in the new sections

---

## Implementation Order

1. **Canonical definition replacement** (Part 1, Fix 1) — find and replace the core definition in every prompt
2. **Core rigor prompt pass** (Part 1, Fix 2) — prompt-only, foundation for everything else
3. **`coreVsBase` type + UI rendering** (Part 1)
4. **Barriers & Frictions** (Part 2) — prompt, type, UI section
5. **Findability** (Part 3) — prompt, type, UI section
6. **In-Market Behavior** (Part 4) — prompt, type, UI section
7. **Trusted Voices** (Part 5a) — prompt, type, UI section
8. **Trust Transfer Paths move** (Part 5b) — UI move
9. **Real World Habitat** (Part 6) — lens + synthesis prompts, type, UI section
10. **Signals Snapshot** (Part 7) — prompt, type, new component (do this LAST — it derives from the sections above, including Real World Habitat)
11. **Run a full test report** and review against the testing checklist

Watch the synthesis output size: this round adds several structured outputs to the Synthesis agent. If output starts getting truncated or quality drops, split the new outputs into a second synthesis call (same batch, parallel) rather than cramming one call — flag this decision back rather than silently degrading quality.

---

## Testing

1. **Definition check** — grep `src/lib/prompt.ts` for the old definition language ("most socially active"). It should be gone everywhere, replaced by the canonical definition. The RESEARCH IMPLICATION paragraph should appear in the three lens prompts only.
2. **Early-mover test** — run a new report. Read the influential core description: does it describe early-adopting, trusted, community-embedded people? If it leads with content creators or follower counts without peer-trust evidence, the definition isn't landing. Named creators should appear only with evidence they're trusted as peers ("repeatedly cited in community threads"), not because they're big.
3. **Core rigor** — spot-check trust signals, emotional drivers, entry points: do they describe the core specifically? Are there explicit core-vs-base contrasts where the lenses found differences? Is anything labeled "broad-audience signal" where core evidence was missing?
4. **Barriers** — 4-8 barriers with mixed types, real evidence, intensity bars rendering on Motivational tab.
5. **Findability** — interests/searches/platforms/adjacencies populated in the core's own vocabulary; specific spaces (subreddit names, hashtags), not generic platforms.
6. **In-Market Behavior** — four blocks populated and grounded; check it admits thin evidence rather than inventing a journey.
7. **Trusted Voices** — ranked archetypes with trust mechanisms; NO invented named individuals; fragility notes present.
8. **Trust tab** — now shows Trust Signals → Trusted Voices → Trust Transfer Paths. Tab 1 no longer shows Trust Transfer Paths.
9. **Real World Habitat** — renders on Social tab below Digital Habitat, mirrored styling; contexts are evidenced (dialogue patterns cited), not speculative; ordered by strength. If offline evidence was thin, the section is short and says so rather than padded.
10. **Signals Snapshot derivation** — every snapshot entry must trace to its source section: motivational entries match Emotional Driver Dashboard names and scores; behavioral entries appear in Behaviors and Triggers with "high" ratings; trust entries match high-scoring Influence Susceptibility subsets with a one-step-deeper specific (means of influence or type of peer); social entries match top items from Influence Map / Digital Habitat / Real World Habitat. Spot-check that no entry exists in the snapshot that isn't in the full report with the same score.
11. **Snapshot ordering + format** — entries ordered by score descending within each box; format renders as `label — detail · score`; at least one real-world context appears in the social box when Real World Habitat has well-evidenced entries; boxes click through to their tabs; responsive stacking works. The coreLabel in the snapshot's center circle is the identical archetype name used in the Influential Core description above it — not a paraphrase.
12. **Old reports** — load pre-Round-4 reports: no new sections, no snapshot, no errors. Trust Transfer Paths appears on Trust tab (data exists in old reports).
13. **No recommendation creep** — scan all new output text for campaign ideas, content territories, or partnership suggestions. There should be none.
