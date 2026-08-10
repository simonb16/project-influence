# SWAY Round 6a: 2.0 UI Restyle
## Claude Code Brief

*Reference: Maria's mockups — `Influential Core.html`, `Influential Core + Influence Signals.html` (attach both). They are Claude-artifact bundles; open them in a browser to see the rendered design. Match their look and feel, but implement in our component system — do NOT transplant their CSS or single-file structure.*

---

## Build Summary

| | |
|---|---|
| **What changes** | Fonts app-wide · Influential Core tab redesign · new Social tab layout (best-effort data mapping) · new Activation tab · new Graveyard tab · one small synthesis prompt addition (core naming) |
| **What doesn't change** | Pipeline, agents (except the naming prompt), schemas (additive optional fields only), localStorage |
| **Tabs** | 9: The Influential Core · Social · Trust · Behavioral · Motivational · Cultural · Activation · Adjacencies · Graveyard |
| **Backward compatible** | Yes — old reports render fully; missing new fields fall back gracefully |

---

## Part 1: Typography

Adopt the mockups' type system app-wide:

- **Instrument Sans** — all UI text, headings, body copy
- **JetBrains Mono** — labels, scores, numbers, and the letterspaced small-caps tags (eyebrows like "THE INFLUENTIAL CORE", score digits, type badges, axis labels)

Both are Google Fonts — load via `next/font/google` (best: no layout shift, self-hosted at build). Replace the current font stack in the Tailwind config / globals. The mockups' conventions: mono labels are ~9-10px, letterspacing ~0.12-0.14em, uppercase, muted (rgba(232,232,236,.35-.55)); scores are mono bold, large (34px), tight letterspacing. Body stays Instrument Sans.

Apply consistently to ALL tabs — this alone should make every existing section feel like the new design.

---

## Part 2: The Influential Core Tab — Redesign

Rebuild the tab to match the `Influential Core.html` mockup layout:

### Header block

- Top bar: report title (growth audience name) left; two buttons right: **"Inputs"** and **"← New Analysis"**
- **Report Inputs moves behind the "Inputs" button** — a modal or collapsible panel showing audience/brand/context as currently rendered. No longer inline at the top.

### Hero section (three-column)

1. **Left: core-size ring visual** — concentric representation of the influential core within the growth audience: outer dashed ring (GROWTH AUDIENCE) with a small filled circle (CORE · {size}%). Caption beneath: "A small circle in the rest of the audience" sentiment — keep it minimal. If no size estimate exists in the data, render the rings without the % label.
2. **Center: the name treatment**
   - Eyebrow (mono, letterspaced, accent): "THE INFLUENTIAL CORE"
   - Big name: `coreName` (see Part 5) — large serif-weight display in Instrument Sans (mockup uses ~34-40px)
   - One-liner beneath: `coreTagline` ("The one others text before buying a bottle.")
   - Meta chips (mono, small): core size ("8–15% of audience"), skew ("skews 30–38") when available, analysis date
3. **Right: compact scores panel**
   - SUSCEPTIBILITY — big mono number, one-word tier ("Moderate"), caption "How difficult they are to influence"
   - INITIATOR — big mono number, tier ("Trendsetter"), caption "How influential they are"
   - Beneath both: the IMITATOR ←→ INITIATOR slider bar (exists today)

### Below the hero, in order

1. **The Story** — the executive summary paragraph (exists today; mono eyebrow "THE STORY")
2. **Influential Core description** — the full core narrative (exists today)
3. **Signals Snapshot** — unchanged component, restyled by the font pass
4. **Activation Recommendations link card** — compact card: "Activation Recommendations — plays for engaging the core" with an "OPEN →" affordance that switches to the Activation tab. The list itself no longer renders here.

### Removed from this tab → Graveyard (Part 4)

- Research Depth panel
- Influence Susceptibility expanded detail: the four channel breakdowns (Peer/Creator/Algorithm/Brand influence) AND the Most Open To / Resists-Rejects panels
- Signal Check section (parked in Graveyard until Round 6b folds its data into the social signals)

The overall susceptibility + initiator NUMBERS survive in the hero panel — it's the expanded detail that moves to Graveyard.

---

## Part 3: Social Tab — New Layout (best-effort mapping)

Rebuild per the `Influential Core + Influence Signals.html` mockup. This round implements the LAYOUT with existing data mapped into it; Round 6b upgrades the data model underneath. Header concept: "Social Signals".

### 3a. Signal Map (top)

Scatter chart:
- **Y axis: SIGNAL STRENGTH** · **X axis: SCALE** (labeled MICRO / NICHE / SIGNIFICANT / MAINSTREAM)
- Corner labels (mono, letterspaced): CONCENTRATED CONVICTION (top-left), SCALED MOMENTUM (top-right), BACKGROUND ACTIVITY (bottom-left), WIDESPREAD INTEREST (bottom-right)
- Dot color = signal type: content `#7c7cff` · digital `#5fc4e8` · physical `#e8a94a` (use our design tokens' nearest equivalents)
- Legend: CONTENT / DIGITAL / PHYSICAL
- Click a dot → scroll to that signal's card
- Hover → tooltip with name + scores (reuse the quadrant tooltip pattern from Round 5)

### 3b. Signal cards (the unified list)

Filter chips above: **All · Content · Digital spaces · Physical spaces**

Each card: number (#01…), type badge (CONTENT TYPE / DIGITAL SPACES / PHYSICAL SPACES in its color), signal title, then labeled rows:
- **WHERE** — platform/context
- **WHO** — the people/voices involved
- body paragraph
- **STRENGTH** bar + score (mono)
- Right rail: **TARGETABLE SIGNALS** — platform → what to target rows ("YouTube — trending interests", "Reddit — subreddits, leading community voices", "Google — trending keywords")

### 3c. Best-effort mapping from existing data

Until 6b provides native signal objects, derive the card list per report:

| Source (existing) | Type | WHERE | WHO | STRENGTH | SCALE (x-position) |
|---|---|---|---|---|---|
| Digital Habitat items | DIGITAL SPACES | platform field | from description where inferable, else omit row | engagement score | reachLevel if present on a matching influence item, else NICHE |
| Real World Habitat items | PHYSICAL SPACES | context | from description, else omit | strength score | NICHE (physical contexts are inherently local) unless evidence says otherwise |
| Influence Map items | CONTENT TYPE | channels/context field | omit if unknown | influence intensity | reachLevel |
| Findability (if present) | — feeds TARGETABLE SIGNALS | — | — | — | — |

Targetable signals rail: if the report has Round 4 `findability` data, derive per-card entries from platformConcentrations + searchBehaviors relevant to that signal's platform; otherwise render a single generic targetable block at the top of the list from findability, or omit entirely for pre-Round-4 reports. Do NOT invent targeting parameters that aren't in the data — an absent rail is fine.

Mark this mapping code clearly as transitional (`// TRANSITIONAL: replaced by native socialSignals in Round 6b`).

### 3d. Language Codes

Moves to the BOTTOM of the Social tab (currently top).

### 3e. Influence Quadrant

Remove from Social → Graveyard. The Signal Map supersedes it as this tab's chart. (Its click-through and hover logic get reused by the Signal Map.)

---

## Part 4: Graveyard Tab

Last tab, visually muted (dimmer label). Purpose: removed components, kept renderable in case we bring them back.

- Header: "GRAVEYARD" with subheading "Retired sections — kept for reference."
- Renders, with existing components unchanged, in muted container cards: Research Depth · Influence Susceptibility expanded detail (channels + Most Open To/Rejects) · Signal Check · Influence Quadrant
- Each entry gets a small mono tag noting where it used to live ("formerly: The Influential Core tab")
- If a report lacks data for a section, it simply doesn't appear — no placeholders

---

## Part 5: Core Naming (small synthesis prompt change)

Add to the synthesis prompt:

```
CORE NAME:
Produce two fields for the influential core:
- coreName: a memorable NAME, 4 words maximum. It should feel like a title, not a description — interesting and actionable beats exhaustively correct. "The Pre-Whole-Foods Adopter" not "the experienced multi-craft peer who refuses to monetize". Capitalize as a title.
- coreTagline: one short sentence that completes the picture ("The one others text before buying a bottle.")
The existing coreLabel field continues to be produced for compatibility. The Signals Snapshot center circle now uses coreName.
```

Types: add optional `coreName` and `coreTagline` to the synthesis output. **Fallback:** old reports use `coreLabel` in the hero and snapshot, with no tagline. Also surface `estimatedProportion` (exists in lens/reconciled data) as the core size chip when parseable ("8–15%"); omit the chip when absent.

---

## What NOT to Change

- Pipeline, agent architecture, tool-use loop — untouched
- All other tabs (Trust, Behavioral, Motivational, Cultural, Adjacencies) — content untouched; they only inherit the font pass
- localStorage schema — no changes; all new fields optional
- No deletion of any component code — removed sections live on in Graveyard

---

## Implementation Order

1. Fonts (Part 1) — global, verify every tab
2. Graveyard tab scaffold (Part 4) — gives removals a destination before anything moves
3. Influential Core tab redesign (Part 2)
4. Core naming prompt + fields (Part 5)
5. Social tab layout + best-effort mapping (Part 3)
6. Full pass on an old report (pre-Round-4), a Round-4 report, and a Round-5 report

## Testing

1. **Fonts** — Instrument Sans + JetBrains Mono render on every tab; mono used for all labels/scores/badges; no fallback-font flashes.
2. **Old report (pre-Round-4)** — core tab renders with coreLabel fallback, no tagline, no size chip; Social tab shows mapped cards from whatever data exists; Graveyard shows its sections; nothing errors.
3. **Round-5 report** — core hero fully populated after one new run (coreName/coreTagline present); Signal Map plots all mapped signals with correct type colors; click/hover works.
4. **Inputs** — behind the button, opens/closes cleanly, shows all three inputs.
5. **Activation tab** — contains the recommendations list; the core tab link card navigates to it.
6. **Graveyard** — all four retired sections render with "formerly" tags; muted styling; absent data = absent entry.
7. **No invented targeting** — Targetable Signals rails only show findability-derived content; pre-Round-4 reports show none.
