# SWAY Round 9: Signal Clarity — Behavioral Buckets + Trust Removal
## Claude Code Brief

*Origin: Maria's Aug 17 feedback deck. Two structural changes: the Behavioral tab reorganizes around four observable-behavior buckets, and the Trust tab retires. Plus: entry points move to Activation, the snapshot goes to three boxes, and tab subtitles adopt her purpose definitions. Her diagnosis, verbatim: "Behavioral signals are a bit confusing — it's currently mixing a few different things — entry points, communities and channels, targetable signals, in-market behavior." Her reassurance on data risk: "nearly everything we're already surfacing in the Behavioral tab fits into these four buckets. It's really just a simpler way to organize the same analysis — and makes it much clearer what we could actually target."*

---

## Build Summary

| | |
|---|---|
| **Behavioral tab** | Rebuilt: four buckets — What They Search · What They Consume · What They Buy · Where They Go — each item: Signal → Targetable Signal → What It Signals → Reinforcing Evidence |
| **Trust tab** | Removed. ALL trust sections (Trust Signals, Trusted Voices, Trust Transfer Paths) park in Graveyard AS-IS — pending a Maria decision (see Part 4). Trust data still produced. |
| **Entry Points** | Move (with Approach/Avoid) to the Activation tab |
| **Snapshot** | 4 boxes → 3 (TRUST box removed) |
| **Tabs (8)** | The Influential Core · Social · Behavioral · Motivational · Cultural · Activation · Adjacencies · Graveyard |
| **Agents touched** | Lenses (behavioral look-for lists), Reconciliation (behavioralSignals output), Enrichment (per-item targetables), Verifier (schema extension) |
| **Backward compatible** | Yes — old reports render the legacy Behavioral layout; trust content appears in Graveyard |

---

## Part 1: The Behavioral Signal Model

New output: `behavioralSignals` — the native data for the rebuilt tab.

```typescript
interface BehavioralSignal {
  id: string;
  bucket: 'search' | 'consume' | 'buy' | 'go';
  signal: string;            // the exact observable: "Stash-busting pattern searches", "Ravelry project logs", "Beginner craft kits", "LYS sit-and-stitch hours"
  targetableSignal: string;  // the actionable version: "searching 'stash busting crochet' on Google; 'no buy year' query cluster"
  whatItSignals: string;     // ONE sentence: what this behavior reveals about the Influential Core
  reinforcingEvidence: Array<{  // what makes this signal worth acting on
    evidence: string;        // "'visible mending' searches +25% YoY", "1.8M members, ~3% contribution layer", "three-lens convergence, composite 7.8"
    source: string;          // attribution per existing rules: tool result, search-sourced, or named lens evidence
  }>;
  strength: 'high' | 'medium';  // existing rating conventions
}
```

**Ownership follows the 6b/8 pattern:**
- **Reconciliation** selects the signals, assigns buckets, writes signal/whatItSignals, and attaches reinforcingEvidence — using its tools and the lens evidence, with all attribution rules unchanged (a reinforcing-evidence line cites a tool result, is marked search-sourced, or names its lens source; nothing bare).
- **Enrichment** writes `targetableSignal` per item (its specialty, same merge-guard authority rules — it may not add/remove/re-bucket signals).
- Aim for 3-6 signals per bucket, evidence permitting. A thin bucket (especially Buy) shows fewer items — never padded. All four bucket headers render even when a bucket has 1-2 items.

### Reinforcing evidence — the meaning (from Simon)

"Signals, data, trends, behavior etc. that reinforce the signal as something worth acting on." This is the per-item version of the ✓ VALIDATED machinery: search growth numbers, community-size/layer data, convergence composites, documented behavioral evidence. It answers a marketer's "why should I act on this one?"

## Part 2: Lens Research Guidance (Maria's look-for lists)

Add to the lens agents' research instructions — these are adapted from Maria's own spec (slide 5) and are excellent research directives:

```
BEHAVIORAL EVIDENCE — collect observations in four categories as you research:

SEARCH — specific search terms and query clusters; "how to", "best", "near me", "versus" and review searches; problems/needs expressed as questions; recurring seasonal searches; rising or accelerating search behaviors; searches connecting the audience to adjacent categories.

CONSUME — videos and topics watched; named channels and creators; websites, apps, newsletters, podcasts; recurring thread topics; tutorials, reviews, comparison content; formats producing unusually strong engagement; repeated consumption across multiple platforms.

BUY — products and categories being researched; brands and retailers being considered; recent or repeated purchases; repurchase and replenishment patterns; secondhand and resale purchasing; delayed or intentionally avoided purchases (avoidance is a purchase behavior).

GO — stores and retailer types mentioned; events and conferences; community and cultural spaces; venues visited; recurring local gatherings; places appearing across multiple conversations or sources.

Report the exact observable (the query, the channel, the product, the venue) with its evidence — not a summary of the category.
```

## Part 3: Behavioral Tab UI

**New layout, top to bottom:**
1. Four bucket sections in order: **WHAT THEY SEARCH · WHAT THEY CONSUME · WHAT THEY BUY · WHERE THEY GO** (mono eyebrows, consistent styling with existing sections)
2. Each item renders: **Signal** (title) · strength tag · **What it signals** (the one-liner, muted) · **Targetable signal** (labeled row, the actionable phrasing) · **Reinforcing evidence** (compact list with attribution styling matching existing validation lines)
3. **Affinity Adjacencies** stays at the bottom of the tab (it's behavioral-adjacent and Maria didn't flag it)

**Sections leaving this tab:**
- Entry Points + per-entry Approach/Avoid → **Activation tab** (render above Activation Recommendations; unchanged content, new home)
- Behaviors and Triggers, Habitual Behaviors, In-Market Behavior, Findability (as a UI section) → **Graveyard** with "formerly: Behavioral tab" tags. Their DATA continues to be produced (backward compat + findability still feeds Enrichment's targetable work).

**Tab subtitles + in-tab headers adopt Maria's purpose definitions (slide 13), split by surface:**

*Tab-bar subtitles (short, replace current ones):*
- Social: "How influence moves"
- Behavioral: "How the audience becomes findable"
- Motivational: "What motivates them to act"

*In-tab header block (NEW — renders at the very top of each signal tab's content, above the first section):*
```
Title:     Social
Subhead 1: How influence moves
Subhead 2: use it to find the right voices, communities and environments
```
```
Title:     Behavioral
Subhead 1: How the audience becomes findable
Subhead 2: use it to build targetable audiences from observable behavior
```
```
Title:     Motivational
Subhead 1: What motivates them to act
Subhead 2: use it to inform messaging
```
Styling: title in the display treatment, subhead 1 as the lead line, subhead 2 muted beneath it — consistent across the three tabs. (Motivational's content is unchanged this round — her messaging framework is TBD — but the header sets the destination.) Other tabs keep their current subtitles and get no header block this round.

## Part 4: Trust Tab Removal

- Remove Trust from the tab bar.
- ALL three trust sections — Trust Signals, Trusted Voices, Trust Transfer Paths — move to **Graveyard as-is**, rendered intact with "formerly: Trust tab" tags. This is a park, not a deletion: **pending a Maria conversation** (there's a live proposal to resurrect Trusted Voices inside Social under its new "find the right voices" job — do NOT implement that now; it's a checkpoint discussion item).
- Trust data (trustedVoices, trust signals, transfer paths) **continues to be produced by the agents** — schema untouched, so resurrection is a UI move only.
- **Signals Snapshot: 4 boxes → 3.** Remove the TRUST box; adjust the layout for three boxes around the center circle (e.g., left column MOTIVATIONAL, right column BEHAVIORAL + SOCIAL, or a balanced triangle — implementer's call, keep it composed). The snapshot's trust derivation code stays (unused for rendering, harmless).

## Part 5: Verifier Extension

Extend schema-conformance (code check) minimally: `behavioralSignals` present on new reports; every item has bucket/signal/targetableSignal/whatItSignals non-empty; buckets limited to the four values; every reinforcingEvidence entry has non-empty source. The number-audit checks apply to reinforcing-evidence numbers automatically (same fields pattern — verify they're included in extraction). Add distinctive strings from any new in-prompt exemplars to the leakage list.

## Part 6: Exemplars (format only — and leakage-listed)

Use Maria's item example as the in-prompt FORMAT exemplar, marked structure-not-content:
```
Signal: Beginner craft kits (the exact observable purchase)
Targetable Signal: searching for beginner craft kits on Google, watching beginner crafting tutorials on YT
What it signals: [one sentence on what the behavior reveals about the Influential Core]
```
Add "beginner craft kit" to the exemplar-leakage list as a same-audience-tolerated term (WARN cross-audience only, consistent with existing rules).

---

## Backward Compatibility

- Old reports (no `behavioralSignals`): Behavioral tab renders the LEGACY layout (current sections, unchanged) — the 6a transitional pattern. New reports render buckets exclusively.
- Old reports' trust content: appears in Graveyard (sections render from existing data).
- No schema removals or renames anywhere. Entry Points data unchanged — only its rendering location moves.

## What NOT to Change

- Motivational tab content (Maria's messaging framing is TBD)
- Core naming, hero, story, snapshot content derivation (beyond removing the trust box)
- Social tab (pending the checkpoint decision on Trusted Voices)
- Pipeline shape, models, budgets
- Anti-padding and attribution rules — every part above depends on them

## Implementation Order

1. Types + lens look-for lists (Parts 1, 2)
2. Reconciliation behavioralSignals production + Enrichment targetable step
3. Behavioral tab UI (buckets) + legacy path preserved (Part 3)
4. Entry Points → Activation move
5. Trust removal + Graveyard parking + snapshot 3-box (Part 4)
6. Verifier extension + leakage list (Parts 5, 6)
7. Full test run + review

## Testing

1. **New report:** four buckets render with 3-6 items each (thin buckets acceptable, padded buckets are a FAIL of review); every item has all four components; targetables carry layer/mechanism specificity per the 8b floor; reinforcing evidence is attributed (spot-check against tool logs).
2. **Old report:** legacy Behavioral layout intact; Trust sections visible in Graveyard; no Trust tab; snapshot shows 3 boxes without layout breakage on BOTH old and new reports.
3. **Activation tab:** entry points + approach/avoid render above recommendations; core tab's link card still works.
4. **Verifier:** clean footer on an honest run; corrupt a bucket item (blank whatItSignals, bare evidence number) and confirm catches.
5. **Bucket integrity:** "Buy" items are purchases/considerations/avoidances (not consumption); "Go" items are places/events (not platforms — platforms belong to Consume). Spot-check the agents didn't blur bucket boundaries.
6. **Subtitles + headers** — tab bar shows the short subtitles ("How influence moves" etc.); each of the three signal tabs opens with the title/subhead/subhead header block; other tabs unchanged.
