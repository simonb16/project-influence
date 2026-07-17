# SWAY Round 2: Input Form + UI Restructure
## Claude Code Brief

---

## What This Round Does

Three changes:

1. **Replace the input form.** The current archetype name + description fields become three fields: Audience, Brand (optional), and Context (optional).
2. **Restructure the report UI.** The current 7-tab layout (Overview, Influence & Entry, Emotional Landscape, Digital Habitat, Cultural Signals, Periphery, Funnel) becomes 4 tabs: **Influence**, **Influence Map**, **Entry Points**, and **Periphery**.
3. **Add a Periphery agent.** A dedicated Periphery agent runs as Batch 4 (after Reconciliation), researching adjacent audiences and interest overlaps for the *entire* audience. The agent pipeline becomes 3-1-1-1 (6 agents total).

Also: bump each lens agent's search limit from 15 to 25 to increase research depth.

---

## Part 1: Input Form

### Replace the current form in `src/app/page.tsx`

**Current fields:**
- Archetype Name (text input, required)
- Archetype Description (textarea, required)

**New fields:**

| Field | Label | Type | Required | Placeholder |
|-------|-------|------|----------|-------------|
| audience | AUDIENCE | textarea | Yes | "Describe the audience psychographically — not demographics like 'women 25-40', but how they think, what they care about, and how they behave. e.g., 'Working moms who are desperate to find some time for themselves — they discover products through other moms on social media and buy things that feel like small acts of rebellion against the never-ending to-do list.'" |
| brand | BRAND | textarea | No | "Optional — the brand in this equation. Name, category, positioning, and any relevant context. e.g., 'Ritual — DTC vitamins, positioned around transparency and clean ingredients, strong with wellness-forward millennials but looking to expand beyond the already-converted.'" |
| context | CONTEXT | textarea | No | "Optional — why is this research happening now? A market shift, a new product launch, a strategy pivot? e.g., 'We're launching a men's line in Q1 and need to understand how influence works in men's wellness.'" |

**Form behavior:**
- Audience is required. Brand and Context are optional.
- If Brand is empty, the Brand Lens agent should pivot to category-level analysis (see prompt update below).
- If Context is empty, the Context Lens agent should do broad market/cultural scanning without a specific strategic focus.
- The "Generate Intelligence Report" button text should change to **"Generate Influence Report →"**
- Keep the example archetypes below the form, but update them to show the new field format. Each example should populate all three fields when clicked.

**Updated example archetypes:**

Example 1:
```
Audience: "New Peloton subscribers — 30-something professionals who bought the bike during a guilt-motivated fitness restart, ride 2-3x a week but worry they're not 'Peloton people', and use the leaderboard as motivation but feel intimidated by the top riders."
Brand: "Peloton — connected fitness platform, premium positioning, strong cult following but facing subscriber growth challenges post-pandemic."
Context: "Post-hype phase — the cultural narrative has shifted from 'Peloton is everything' to 'is Peloton still worth it?' and competitors like Apple Fitness+ and free YouTube workouts are pulling casual users."
```

Example 2:
```
Audience: "Millennial natural wine enthusiasts — 28-36, drinks natural wine, shops at Trader Joe's and Whole Foods, uses Vivino, follows food content on Instagram, cares about provenance and process but doesn't want to be seen as a snob."
Brand: (empty)
Context: "The natural wine bubble may be peaking — mainstream grocery stores are stocking 'natural' labels, which threatens the insider credibility that drove the movement."
```

Example 3:
```
Audience: "Home crafters — people who love to dabble in crafting without wanting to overcommit, consider it an outlet for creativity but don't want to make it their identity or a side hustle."
Brand: (empty)
Context: (empty)
```

### Update data flow

The three input fields need to flow through the SSE pipeline to the agents:

1. **`page.tsx`** — captures `audience`, `brand` (optional string), `context` (optional string) and sends them in the POST body to `/api/analyze`
2. **`route.ts`** — receives the three fields, passes them to the agent execution pipeline
3. **`prompt.ts`** — template functions already accept inputs; update the variable names from `archetypeName`/`archetypeDescription` to `audience`/`brand`/`context`
4. **`storage.ts`** — update the stored report shape to include `audience`, `brand`, `context` instead of `archetypeName`/`archetypeDescription`. Keep backward compatibility: if loading an old report with `archetypeName`, map it to `audience` for display.

### Update agent prompts for optional inputs

In `src/lib/prompt.ts`, update all prompts to use the new field names:

**Replace in all prompts:**
```
AUDIENCE TO RESEARCH:
Name: {archetypeName}
Description: {archetypeDescription}
```

**With:**
```
AUDIENCE:
{audience}

BRAND:
{brand || "No specific brand provided. Analyze brand dynamics in this audience's space at the category level — which brands have credibility, which approaches work, where is there white space."}

CONTEXT:
{context || "No specific context provided. Research the broader market and cultural forces shaping this audience right now without a specific strategic lens."}
```

The Brand Lens agent's prompt already handles brand-level vs. category-level analysis. The fallback text above ensures the agent knows to pivot when no brand is provided.

---

## Part 2: UI Restructure — 4 Tabs

### Replace the tab structure in `src/components/report/ReportView.tsx` and `src/components/report/TabBar.tsx`

**Current tabs (7):** Overview, Influence & Entry, Emotional Landscape, Digital Habitat, Cultural Signals, Periphery, Funnel (beta)

**New tabs (4):** Influence, Influence Map, Entry Points, Periphery

### Tab 1: Influence — "Who Matters?"

This tab combines the current Overview content with the Influential Core section, restructured around the concept of identifying who holds influence in this audience.

**Layout (top to bottom):**

**1. Report header**
- The audience description (from user input) displayed as a styled blockquote
- Brand and Context shown below if provided (smaller, muted text)
- Generated date

**2. Research Depth metrics**
- Keep the current metrics bar: Signals Scored, Converged, Conflicted, Single-Lens, High Confidence, Avg Composite
- Keep "3 independent lenses · audience · brand · context"

**3. The Influential Core (main section)**
- Keep exactly as it renders now — the definition paragraph, the profile paragraph, key behaviors, key tensions
- Add two more subsections from the existing data:
  - **Language Codes** — render `influentialCore.languageCodes` as a list of insider terms/phrases with context
  - **Trust Signals** — render `influentialCore.trustSignals` as a list of what makes things credible to the core

**4. Influence Quadrant (new visualization)**
- Plot influence map items on a 2D chart:
  - X-axis: Reach Level (micro → niche → significant → mainstream), mapped to positions
  - Y-axis: Composite Score (1-10 scale)
- Each item appears as a dot/bubble with its name as a label
- Color-code by convergence status: converged = solid, conflicted = outlined with warning color, single-lens = muted
- The quadrant lines divide the space into 4 zones:
  - Top-right: "The Obvious" (high reach + high score)
  - Top-left: "The Hidden Core" (low reach + high score) — highlight this zone, it's where SWAY's value is
  - Bottom-right: "The Noise" (high reach + low score)
  - Bottom-left: "The Periphery" (low reach + low score)
- Clicking a dot should scroll to or highlight that item in the Influence Map tab
- This can be built as an SVG or canvas element. Keep it clean and simple — dark background consistent with the current design system.

### Tab 2: Influence Map — "What Moves Them?"

This tab combines the current Influence & Entry tab's influence items, Emotional Landscape, Digital Habitat, and Cultural Signals into a single unified view of the forces that move the influential core.

**Layout (top to bottom):**

**1. Influence Map items (the ranked list)**
- Keep the current influence map item cards exactly as they render now (name, composite score badge, convergence indicator, behavioral role, description, influence intensity bar, platform tags)
- These are already working well — don't change the card design

**2. Emotional Landscape section**
- Keep the existing emotional drivers visualization as-is
- Place it below the influence map items under a section header "Emotional Drivers"

**3. Digital Habitat section**
- Keep the existing digital habitat content as-is
- Place it under a section header "Digital Habitat"

**4. Cultural Signals section**
- Keep the existing cultural discourse + behavioral signals + cultural depth check content as-is
- Place it under a section header "Cultural Signals"

**Why keep these sections?** They're already rendering well and contain good data from the three-lens architecture. We're not throwing them away — we're reorganizing them under the "Influence Map" umbrella so they read as one connected view of what moves this audience, rather than separate tabs that feel disconnected.

### Tab 3: Entry Points — "Where to Show Up"

This tab focuses entirely on actionable recommendations.

**Layout (top to bottom):**

**1. Entry Points list**
- Keep the existing entry points cards as they render now
- Each card shows: name, type badge, description, rationale, approach guidance, what to avoid, confidence level
- If the current entry points section doesn't have the "approach" and "avoid" fields populated, that's fine — they'll populate once the synthesis prompt is already outputting them (it should be from Round 1)

**2. Activation Recommendations**
- Pull from `influentialCore.activationRecommendations`
- Render as a section below entry points: "Activation Playbook" or "How to Activate the Core"
- Each recommendation as a card or styled list item

**3. Influence Susceptibility (if present)**
- Keep the existing influence susceptibility section
- Render under "How This Audience Responds to Influence"
- Shows high susceptibility areas, low susceptibility areas, and trust transfer paths

### Tab 4: Periphery — "Who Else Are They?"

This tab maps the adjacent audiences, interests, and subcultures that overlap with the audience being researched. It answers: "beyond this core interest, what other worlds do these people live in?"

**Important:** The Periphery agent researches overlap with the **entire audience** — not just the influential core. The influential core is a lens for understanding how influence works *within* the audience; the periphery map is about what's *adjacent to* the audience as a whole.

**Layout:**

**1. Periphery Map visualization**
- Keep the existing `PeripheryMap.tsx` component and its concentric rings design
- **Inner ring (80-100% overlap):** audiences/interests that almost everyone in this audience shares — these are near-universal adjacencies
- **Outer ring (50-80% overlap):** audiences/interests that a significant portion shares — these are expansion opportunities
- Four segments dividing the rings: **Mindset** (values, beliefs, worldview), **Lifestyle** (habits, routines, life stage), **Interest** (hobbies, passions, content), **Entertainment** (media, creators, platforms)
- Each item in the rings should show: name, overlap strength (%), and a one-line description

**2. Periphery insights**
- Below the visualization, render a narrative section from the Periphery agent's output:
  - **Surprising overlaps** — adjacencies that are non-obvious and strategically interesting
  - **Bridge opportunities** — where this audience connects to entirely different worlds (useful for brand partnerships, content strategy, media buying)
  - **Audience expansion paths** — ranked suggestions for where this audience bleeds into larger or adjacent populations

**Data source:** This tab is populated by a dedicated Periphery agent (see Part 3 below). The Periphery agent runs as Batch 4 after the Reconciliation agent, so it has access to all reconciled lens data.

---

## Part 3: Periphery Agent — Batch 4

### Add a Periphery agent to the pipeline

The agent pipeline changes from **3-1-1** (5 agents) to **3-1-1-1** (6 agents):

| Batch | Agents | Model | Searches |
|-------|--------|-------|----------|
| Batch 1 (parallel) | Audience Lens, Brand Lens, Context Lens | Sonnet 4.6 | 25 each |
| Batch 2 | Reconciliation + Scoring | Fable 5 | 0 |
| Batch 3 | Synthesis | Fable 5 | 0 |
| **Batch 4** | **Periphery** | **Sonnet 4.6** | **25** |

### Why Batch 4 (after Reconciliation, parallel with Synthesis)?

The Periphery agent needs the reconciled understanding of the audience to know *what* to search for adjacent to. It can't run in Batch 1 because it doesn't yet know what the audience actually cares about — the lens agents haven't reported yet. It runs after Reconciliation (Batch 2) so it has the scored, reconciled view of the audience's interests, emotional drivers, and cultural signals to use as search seeds.

**Batch 3 and Batch 4 can run in parallel** — Synthesis and Periphery are independent of each other. Synthesis produces the final narrative report; Periphery produces the adjacency map. Neither needs the other's output. This keeps total latency the same as the current 3-batch pipeline.

### Update `src/lib/agents.ts`

Add the Periphery agent definition:

```typescript
{
  id: 'periphery',
  name: 'Periphery Agent',
  model: 'claude-sonnet-4-6',
  batch: 4, // runs parallel with Synthesis (batch 3) — both depend on Reconciliation (batch 2) output
  maxSearches: 25,
  searchTool: 'web_search_20260209',
  inputFrom: ['reconciliation'], // receives the full reconciled output
}
```

**Update batch execution in `route.ts`:**
- Batch 3 (Synthesis) and Batch 4 (Periphery) can fire in parallel after Batch 2 completes
- Both receive the Reconciliation agent's output as input
- The SSE stream should report Periphery progress alongside Synthesis progress
- Total agent count updates from 5 to 6 in progress calculations

### Periphery agent prompt

Add to `src/lib/prompt.ts`:

```
You are the Periphery Agent in the SWAY Influence Intelligence Engine. Your job is to map the adjacent audiences, interests, and subcultures that overlap with the audience being researched.

You receive the reconciled output from the three independent lens agents (Audience, Brand, Context). This gives you a comprehensive picture of who this audience is, what they care about, how they behave, and what influences them.

Your task: research what OTHER worlds these people inhabit beyond the primary interest being studied. What else do they care about? What adjacent communities do they participate in? What unexpected overlaps exist?

IMPORTANT: You are mapping adjacencies for the ENTIRE AUDIENCE — not just the influential core. The influential core is a subset that drives influence dynamics. The periphery map is about the broader audience's adjacent interests and overlapping identities.

INPUTS:
AUDIENCE: {audience}
BRAND: {brand || "No specific brand provided."}
CONTEXT: {context || "No specific context provided."}

RECONCILED DATA:
{reconciledOutput}

RESEARCH STRATEGY:
Use web search to investigate:
1. What other subreddits, forums, YouTube channels, and social accounts are popular with this audience
2. What adjacent hobbies, interests, and lifestyle choices correlate with this audience
3. What media, entertainment, and content this audience consumes outside their primary interest
4. What values, causes, and worldview elements this audience shares
5. What brands, products, and categories this audience over-indexes on
6. Where this audience shows up that you wouldn't expect

Search for correlations, not assumptions. Look for actual evidence of overlap — shared community membership, cross-posting behavior, co-occurring interests in profiles and bios, audience overlap data from creators who span multiple niches.

ANTI-CONFABULATION RULES:
- Never fabricate overlap percentages. Use qualitative strength indicators (near-universal, strong, moderate, emerging) unless you find actual data.
- Never invent specific community names or creator names. Only cite what you find in search results.
- Source-pin every adjacency claim to what you actually found.
- Prefer "evidence suggests" over false precision.
- If you can't find evidence of an adjacency, don't include it.

OUTPUT FORMAT (JSON):
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
  }
}

Aim for 4-6 items in the inner ring and 6-10 in the outer ring. Quality over quantity — each item should be evidence-backed.
```

### Update types in `src/types/index.ts`

Add or update the Periphery types to match the agent's output format:

```typescript
interface PeripheryItem {
  name: string;
  segment: 'mindset' | 'lifestyle' | 'interest' | 'entertainment';
  overlapStrength: 'near-universal' | 'strong' | 'moderate' | 'emerging';
  description: string;
  evidence: string;
}

interface PeripheryInsights {
  surprisingOverlaps: string[];
  bridgeOpportunities: string[];
  expansionPaths: Array<{
    direction: string;
    rationale: string;
    risk: string;
  }>;
}

interface PeripheryData {
  peripheryMap: {
    innerRing: PeripheryItem[];
    outerRing: PeripheryItem[];
  };
  insights: PeripheryInsights;
}
```

---

## Part 4: Search Limit Increase

### Update `src/lib/agents.ts`

Bump the `maxSearches` (or equivalent config) for the three lens agents:

- `audience-lens`: 15 → **25**
- `brand-lens`: 15 → **25**
- `context-lens`: 15 → **25**

Combined with the Periphery agent's 25 searches, this brings total research volume to 100 searches per report (75 from lenses + 25 from Periphery), exceeding the old architecture's coverage.

No changes needed for reconciliation or synthesis (they don't search).

---

## Part 5: Component Cleanup

### Remove unused components

- `FunnelView.tsx` — Funnel tab is gone

### Keep but reorganize

These components stay but are mounted in new locations:

- `InfluenceMap.tsx` → renders in Influence Map tab (section 1)
- `EmotionalDrivers.tsx` → renders in Influence Map tab (section 2)
- `DigitalHabitat.tsx` (if it exists as separate component) → renders in Influence Map tab (section 3)
- `CulturalDiscourse.tsx` / `BehavioralSignals.tsx` / `CulturalDepthCheck.tsx` → render in Influence Map tab (section 4)
- `EntryPoints.tsx` → renders in Entry Points tab
- `PeripheryMap.tsx` → renders in Periphery tab (keep this component — update it to accept the new Periphery agent output format if the data shape has changed)
- `ResearchTrail.tsx` / `SourceRanking.tsx` → can be placed at the bottom of the Influence Map tab or in a collapsible "Research Sources" section

### New components to create

- **`InfluenceQuadrant.tsx`** — the 2D scatter/quadrant visualization for the Influence tab
- **`ActivationPlaybook.tsx`** — renders the activation recommendations in the Entry Points tab
- **`PeripheryInsights.tsx`** — renders the narrative insights section below the periphery map (surprising overlaps, bridge opportunities, expansion paths)

---

## Part 6: Backward Compatibility

Old reports saved in localStorage use the previous field names and tab structure. Handle gracefully:

- If a report has `archetypeName` but no `audience` field, map `archetypeName` + `archetypeDescription` into the audience display
- If a report has no `influentialCore` field, don't render the Influential Core section (the Influence tab should still work, just without that section)
- If a report has no `scores` on influence items, don't render the quadrant (no data to plot)
- If a report has no `peripheryMap` from the new Periphery agent, the Periphery tab should show a "No periphery data available" message (old reports and reports from older pipeline versions won't have this data)
- Old reports should render in the new 4-tab structure using whatever data they have — sections that can't populate from old data simply don't appear

---

## Part 7: What NOT to Change

- **Agent prompts** (beyond the field name updates described above) — the three-lens architecture is working well, don't change the research strategy or output format
- **Scoring model** — keep as-is from Round 1
- **Authentication** — no changes
- **localStorage mechanism** — no changes to how reports are saved/loaded, just the shape
- **SSE streaming** — update progress messages to reference new field names (not "archetype") and add progress reporting for the Periphery agent in Batch 4, but no structural changes to the SSE mechanism
- **Styling/design system** — keep the current dark theme, card styles, and visual language. The quadrant is the only new visual element.

---

## Testing

After implementation:

1. Run a new report using all three fields (audience + brand + context) — verify all three flow to the agents and the output references the brand and context
2. Run a report with audience only (no brand, no context) — verify the Brand Lens pivots to category-level analysis and the Context Lens does broad scanning
3. Open an old saved report — verify it still renders in the new 4-tab structure without errors (Periphery tab should show graceful empty state for old reports)
4. Check the influence quadrant — are items plotted meaningfully? Is the "Hidden Core" zone populated?
5. Check the Entry Points tab — do activation recommendations render?
6. Verify the search limit increase — agent logs should show up to 25 searches per lens agent
7. Check the Periphery tab — does the concentric rings visualization render with inner/outer ring items? Are the four segments (mindset, lifestyle, interest, entertainment) populated? Do the insights (surprising overlaps, bridge opportunities, expansion paths) appear below the map?
8. Verify the Periphery agent receives reconciled data — check that it runs *after* Batch 2 and that its output references actual findings from the lens agents, not generic guesses
9. Verify Synthesis and Periphery run in parallel — both should start after Reconciliation completes, and total report generation time should not increase significantly from the addition of the Periphery agent
