# SWAY Round 6b: Social Signals Data Model
## Claude Code Brief

*Prerequisite: Round 6a (UI restyle) is implemented — this round replaces 6a's transitional data mapping with a native signal model, and upgrades scoring with quantitative grounding. Reference mockup: `Influential Core + Influence Signals.html`.*

---

## Build Summary

| | |
|---|---|
| **What changes** | New `socialSignals` output (typed, with Where/Who/Targetable Signals) · two-axis signal scoring (strength × scale) · dataSignals folded into signals · core size quantification · lens prompt additions |
| **What doesn't change** | Pipeline shape, agent count, tool-use loop mechanics, tab structure (set in 6a) |
| **Ownership** | **Reconciliation: selects, types, scores, places, and validates the signals** (it has the lens evidence, the scoring role, and the tools). **Synthesis: enriches** (targetable signals, final copy). Lenses: sizing + momentum evidence collection |
| **Backward compatible** | Yes — reports without `socialSignals` keep rendering via the 6a transitional mapping |

---

## Part 1: The SocialSignal Model

The Social tab's native data — one unified list that REPLACES the separate rendering of Influence Map + Digital Habitat + Real World Habitat on this tab (the underlying fields keep being produced — other tabs and old reports still use them).

**Division of labor:**
- **The Reconciliation agent produces the signals**: it identifies which influence mechanisms across the three lenses are real social signals, types them, writes where/who/body, scores strength and scale (using its tool calls to quantify where the placement is uncertain), and links validating dataSignals. This is an extension of its existing scoring role — signal selection and placement are judgment calls that belong with the agent that has the evidence and the tools.
- **The Synthesis agent enriches them**: it receives reconciliation's signals and adds `targetableSignals` (derived from its findability analysis) and may polish body copy for report tone. It must NOT re-score, re-place, add, or remove signals.

```typescript
interface SocialSignal {
  id: string;                    // stable within report, for map→card linking
  type: 'content' | 'digital' | 'physical';
  signal: string;                // title: "Independent wine newsletters form a trusted source"
  where: string;                 // platform/context: "Substack", "Neighborhood retail"
  who: string;                   // the voices: "Not Drinking Poison, La Mescita, The Feiring Line"
  body: string;                  // 1-3 sentences: what this signal is and how influence moves through it
  strength: number;              // 0-100 — momentum + concentration (see Part 2)
  strengthBasis: string;         // 1 sentence: what the strength score rests on
  scale: 'micro' | 'niche' | 'significant' | 'mainstream';
  scaleBasis?: string;           // the quant behind it: "452K subscribers", "65M+ users", "~2,000 attendees"
  targetableSignals: Array<{ platform: string; detail: string }>;  // "Reddit — subreddits, leading community voices"
  validatedBy?: string[];        // ids/summaries of dataSignals that ground this signal
  evidence: string;
}
```

### Typing rules (reconciliation prompt)

```
Each social signal is one of three types:
- "content" — a content genre, format, tonal code, or proof format that carries influence ("producer-story specificity as proof format", "the anti-snob tonal code")
- "digital" — a digital space or platform community where the core participates ("Substack newsletter ecosystem", "expert-peer Instagram accounts")
- "physical" — a real-world space or gathering where influence moves ("independent bottle shops", "dinner parties", "fairs and salons")

Produce 8-14 signals total with a mix of all three types. Consolidate from your influence map, digital habitat, and real world habitat analyses — one signal per distinct influence mechanism, not one per data source. WHERE and WHO are required on every signal: where it happens, and who the specific voices/actors are (named entities only with evidence; archetypes otherwise).
```

### Targetable signals rules (synthesis prompt — the enrichment step)

```
You receive socialSignals from the reconciled data. Do not re-score, re-place, add, or remove signals. Your job is enrichment:
For each signal, add 2-4 targetable signals: platform → the specific parameter someone would use to find or track this signal ("YouTube — trending interests, channel subscribers", "Google — trending keywords", "Reddit — subreddits, leading community voices", "Instagram — saves and sends, follower overlap", "Vivino — rating velocity, wishlist adds").
Draw from your findability analysis and the signal's own evidence. These are findability parameters, not campaign recommendations. Only name platforms where this signal actually lives.
```

---

## Part 2: Two-Axis Scoring (Reconciliation)

Scoring and placement are the Reconciliation agent's job — an extension of its existing scoring role, and a first-class reason to spend tool budget. The flow within its existing tool-use loop becomes:

```
Read 3 lens outputs
  → identify candidate social signals (mechanisms, spaces, formats)
  → for signals where scale or momentum is UNCERTAIN, spend tool calls to resolve them
    ("is r/crochet niche or significant? — check subscriber count"
     "is the craft-night format growing? — check search trend")
  → score strength + scale for every signal, citing the quant where it exists
  → write the final socialSignals list alongside existing scoring outputs
```

Add to the reconciliation prompt's tool budget guidance: resolving a signal's map placement is a valid use of a tool call, ranked alongside resolving lens conflicts. Placement-critical signals (the ones that will read as "Concentrated Conviction" vs "Scaled Momentum") deserve quant more than obvious ones.

### Strength (Y axis) = momentum + concentration

```
STRENGTH (0-100): how forcefully this signal shapes what the core believes, adopts, and shares.
Two components, weighed together:
- MOMENTUM: is this signal growing? Grounded in trend data where available (search growth %, new-format emergence, fresh upload/post activity) or documented growth evidence from the lenses.
- CONCENTRATION: how dense is the conviction? Engagement ratios (comments per view, thread depth), trust density (named referrals, direct conversion evidence), participation quality.
High strength = growing AND dense ("craft night searches +103%, show-and-tell rituals at every gathering").
State the basis in strengthBasis — one sentence, citing the actual numbers used.
```

### Scale (X axis) = quantified size

```
SCALE: how many people this signal touches. Use the quant when you have it:
- micro: <10K (a niche newsletter, a single city's shops, ~2,000 fair attendees)
- niche: 10K-100K
- significant: 100K-1M
- mainstream: >1M (a 65M-user platform, a mainstream content genre)
Put the number that drove the classification in scaleBasis. When no quant exists (dinner parties, word of mouth), classify from evidence-based reasoning and say so in scaleBasis ("no direct measure — classified niche from prevalence in community discussion"). Default to the smaller bucket when uncertain.
The four corners this creates: CONCENTRATED CONVICTION (high strength, small scale — where the core actually lives), SCALED MOMENTUM (high strength, big scale — what's breaking out), BACKGROUND ACTIVITY (low strength, small scale), WIDESPREAD INTEREST (low strength, big scale — the base, not the core).
```

### Where the quant comes from

Reconciliation's own tool calls — it scores with the numbers it just pulled, no handoff. The `strengthBasis`/`scaleBasis` fields cite them directly. Signals where no tool call was warranted or possible score from lens evidence and say so in the basis fields. The hard rule is unchanged from Round 5: only actual tool results ever appear as numbers — never estimates dressed as data.

---

## Part 3: Fold dataSignals into Signals

The standalone Signal Check section retired to Graveyard in 6a. Its content now lives inside the signals:

- Reconciliation keeps producing `dataSignals` (unchanged schema — powers the Graveyard view and audits)
- Reconciliation links them as it writes the signals: each SocialSignal's `validatedBy` lists the dataSignals that ground it (it created both, in the same pass)
- UI: on each signal card, render a compact validation line when `validatedBy` is non-empty — mono, muted, e.g. "✓ VALIDATED · YouTube: 262K views / 2,499 comments — 250:1 ratio" — pulling the metric + one-line finding from the referenced dataSignal
- dataSignals that validate non-social content (trust, motivational) remain available for future tabs; unlinked ones just don't surface outside Graveyard

---

## Part 4: Core Size Quantification

The 6a hero shows core size from the loose `estimatedProportion` text. Make it a real field:

### Lens prompt addition (all three)

```
CORE SIZE EVIDENCE: Collect any evidence that indicates what fraction of this audience is the influential core: published community statistics (active-contributor ratios, paid-subscriber counts vs audience size), engagement pyramids (what % post vs lurk), category research on enthusiast-to-casual ratios. Report numbers with sources. Do not force an estimate — absence of evidence is a valid finding.
```

### Reconciliation prompt addition

```
CORE SIZE: Reconcile the lenses' size evidence into coreSize: { estimate: "8-15%", basis: <what the evidence is>, confidence: "grounded" | "directional" | "speculative" }. Use tool calls if a targeted lookup can improve grounding (e.g., a subreddit's active-poster statistics vs subscriber count). If evidence is thin, say "directional" — never present a guess as grounded.
```

### UI

- Hero ring + size chip use `coreSize.estimate`
- Confidence surfaces as a small mono tag next to the chip when not "grounded" ("DIRECTIONAL")
- Old reports keep the 6a fallback

---

## Part 5: Round 7 Scouting — Observe and Report

Context you should know: we anticipate a future round ("pipeline decomposition") that splits the Synthesis agent into 2-4 parallel section writers and adds a cheap Verifier agent for automated integrity checks. Reconciliation will stay whole (its value is single-context judgment). **This round is the likely trigger point, and you are the scout.** While implementing and testing 6b, actively collect evidence that will shape that future brief. Do not implement any of it now.

In your final summary, include a "Round 7 observations" section covering:

1. **Output pressure** — actual output token counts for Reconciliation and Synthesis on the test runs, vs their ceilings. Any truncation, retry, or JSON-repair events. Is either agent within 25% of its ceiling?
2. **Edge-quality check** — compare the care level of sections generated early vs late in Synthesis's output (specificity, evidence density). Is there measurable thinning toward the end?
3. **Latency profile** — wall-clock time per pipeline stage on a full run. Where does the time actually go?
4. **Natural seams** — from working in the code: where would Synthesis split most cleanly? Which sections share state or reference each other (hard to separate), and which are truly independent (easy)? Does the enrichment step (targetables) complicate a split?
5. **Verifier shopping list** — as you test, note every check you perform manually that a cheap automated pass could do instead (traceability spot-checks, number-vs-log audits, schema conformance, snapshot-to-section consistency). These become the Verifier agent's spec.
6. **Your recommendation** — given what you observed: is decomposition needed now, soon, or not yet? What would you split first and why?

Flag anything urgent (e.g., truncation actually occurring) immediately rather than saving it for the summary.

---

## Part 6: Backward Compatibility

- `socialSignals`, `quantAnnotations`, `coreSize` all optional. Reports without them render via the 6a transitional mapping — keep that code path.
- When `socialSignals` IS present, the Social tab uses it exclusively (no mixing with the transitional mapping).
- No renames or removals of existing fields. Influence Map / habitats data continues to be produced and stored.

---

## Implementation Order

1. Types (`SocialSignal`, `coreSize`)
2. Lens prompts: core size evidence + (verify existing) momentum evidence collection
3. Reconciliation prompt: socialSignals production — identification, typing, where/who/body, two-axis scoring inside the tool-use loop, validatedBy links, core size
4. Synthesis prompt: enrichment only — targetableSignals + copy polish, explicit do-not-rescore rule
5. UI: Social tab native path (signal map + cards from `socialSignals`), validation lines, hero coreSize
6. Test run + review

Note on reconciliation load: this grows the Reconciliation agent's output meaningfully (signals + dataSignals + coreSize + existing scoring). Watch for output truncation or JSON degradation on the first test run — if it appears, raise its output ceiling first (the Round 4 playbook), and flag before considering a split.

## Testing

1. **New report** — 8-14 signals, all three types present, every signal has WHERE + WHO, map places signals across at least three quadrant regions (all-in-one-corner suggests scoring isn't discriminating).
2. **Scale honesty** — every `scaleBasis` either cites a real number from the run's data or explicitly says it's evidence-classified. Grep the output against tool logs: no invented quant.
3. **Strength basis** — cites momentum and/or concentration evidence specifically.
4. **Validation lines** — signals with matching dataSignals show the ✓ line with the correct metric; numbers match the dataSignal exactly.
5. **Targetable signals** — every entry names a platform the signal actually lives on; nothing generic like "social media — engagement".
6. **Core size** — estimate + basis + confidence present; DIRECTIONAL tag renders when applicable; old reports fall back.
7. **Old reports** — still render via transitional mapping, unchanged from 6a.
8. **Consolidation quality** — signals read as distinct mechanisms, not duplicated per-source entries (the same community shouldn't appear as three cards).
9. **Enrichment boundary** — diff reconciliation's socialSignals against the final report's: synthesis must have added targetableSignals (and possibly polished body copy) but changed NO scores, placements, types, or signal count. Any drift here is a bug.
10. **Tool spend on placement** — check the tool-call log: at least some calls should be placement-motivated ("checking subscriber count to place scale"), and the signals they resolved should cite those exact numbers in scaleBasis.
