# SWAY Round 11A: The Simple UI — Six-Question Restructure
## Claude Code Brief — view layer only

**Companion file (required):** `sway-mockup-A-briefing.html` — the approved interactive design reference. Open it in a browser and click through all seven pages before writing any code. Where this brief and the mockup disagree on visual detail, the mockup wins; where the mockup's *content* is thinner than the data model, the data model wins (see The Prime Rule).

---

## The Diagnosis

The report reads like a firehose to anyone unfamiliar with it: nine rounds of addition and no subtraction, everything at equal visual weight, eight tabs plus a Graveyard, a cockpit affect that tells newcomers "you had to be there." Maria's SWAY OUTPUT deck resolved the organizing principle: structure the report around the five questions a planner walks in with, not around how we derived the answers. We extended her five with a sixth (adjacencies) and added her page-2 idea — "read this as a brief" — as an intent router.

This round is the strategic pivot's first step: a second, simpler *view* over the same pipeline. Nothing about agents, prompts, schemas, or the pipeline changes.

---

## The Prime Rule: Reorganization, Not Reduction

We made this mistake in Round 9 and spent Round 10 fixing it. Not again.

**Every field currently rendered anywhere in the report UI must have a home in the new structure.** The mockup is a hand-curated slice (~⅓ of a real report's volume) built to show the *shape* — featured items + collapsed rows + inventory layers. A real report is the same design with longer row sections, never a trimmed one. The mapping table in Part 2 is exhaustive and binding; if you find a rendered field not covered by it, stop and flag it rather than dropping it or guessing.

---

## Build Summary

| | |
|---|---|
| **Part 1** | Navigation shell: sidebar spine, page-per-chapter routing, light editorial theme, dark chart plates |
| **Part 2** | The six chapters + utility pages, per the binding mapping table |
| **Part 3** | The Summary page — one-page executive summary, derived entirely from existing report data |
| **Part 4** | Two-class hierarchy: featured-vs-row selection logic, scores as words |
| **Part 5** | Verifier display recalibration: neutral "notes" tier |
| **Part 6** | Header stat slots with basis labels + manual platform-reach entry (the one small write path) |
| **What doesn't change** | Agents, prompts, schemas, pipeline, tool registry, Verifier logic (display only), job model, DB schema (one JSONB addition inside report_json acceptable for manual fields) |
| **Explicitly out of scope** | The plan-preview/media-plan section visible in the mockup's Chapter 02 (that is Round 11B — do not build it, do not leave a broken placeholder); platform API integrations (11C); any change to what agents produce |

Branch `round11a`; no merge or deploy without Simon's explicit go.

---

## Part 1: Navigation Shell + Theme

1. **Sidebar spine** replaces the tab bar: Summary, then chapters 01–06, then a visually-separated utility zone (Evidence & sources · Retired sections · Report inputs) with the integrity line ("✓ Verified · N integrity checks") at the bottom. Report name in italic serif under the SWAY wordmark.
2. **Page-per-chapter navigation.** Each chapter is its own view; no long scroll. Chapter switch scrolls to top. Sidebar reflects the active chapter. Summary is the landing view on report open.
3. **Theme** per the mockup's CSS variables: bone background `#F2EFE8`, paper `#FAF8F3`, ink scale, iris accent `#4F4899`, hairline `#DDD7CB`. Fonts: EB Garamond (display/serif moments, multiple weights), Hanken Grotesk (UI/body), JetBrains Mono (data accents only — stat numbers, source lines, chapter numbers). Charts (Signal Map, Periphery Map) keep **dark plates** (`#161419`) as framed canvases inside the light page — do not restyle the chart internals this round beyond making them legible on the plate.
4. **Scope of the theme:** post-Round-9 reports render in the new shell. Pre-Round-9 reports keep their legacy layout untouched (existing pattern). The report *list/home* page may adopt the light theme for coherence but its structure is not this round's concern — minimal touch.

## Part 2: The Six Chapters — Binding Mapping Table

Each chapter page carries: kicker (`Chapter NN`), serif title, italic tagline (Maria's descriptions, verbatim from the mockup), and a "Use this chapter to…" line (evolves the Round 9 header blocks).

| New home | Absorbs (existing render locations) |
|---|---|
| **Summary** (Part 3) | Signals Snapshot (superseded — its derivation rules are reused, the old snapshot UI retires); report header/meta |
| **01 Who are they** | Influential Core tab in full: core hero (name, tagline, size ring + derivation behind a "How we sized the core" disclosure), susceptibility/initiator content, coreVsBase contrasts ("HOW THEY DIFFER FROM THE BASE" eyebrow becomes the side-by-side base/core cards), the four-beat Story (renders here as the chapter's narrative block), base description from audience input + lens base material |
| **02 How to find them in media** | Behavioral buckets Search / Consume / Buy — analyzed signal items (featured/rows per Part 4) AND the full Round 10 inventory layer with every platformConcentration note preserved (the amputation rule stands); targetable signals; Findability-derived content; In-Market Behavior (→ Buy) |
| **03 Where to find them** | Social tab in full: Signal Map (dark plate), social signals (featured = whyOnlyThisAudience winners, rest = rows with evidence disclosures), validatedBy receipts; Behavioral "Go" bucket + Real World Habitat (physical world = placement, not targeting — it moves here); digital habitat material |
| **04 How to move them** | Motivational tab in full: emotional drivers (featured = top-scored driver, rest = rows, scores as words), tensions, triggers; Barriers & Frictions renders as the "What backfires" card |
| **05 How to engage them** | Activation tab: Entry Points, Approach/Avoid (Approach → content/partnership cards; Avoid → may cross-link 04's backfires rather than duplicate), activation outline content. **Render what exists, honestly — this is our thinnest layer and padding it is forbidden.** If thin, it looks thin; depth is a Maria-checkpoint question and the chapter may carry one muted line saying the deeper activation layer arrives with the plan round. |
| **06 Who they're next to** | Periphery in full: adjacency graph (dark plate), adjacent territories as rows — each with its bridge rationale and, where the data supports one, a partnership-angle line (existing bridge/evidence content rephrased in render, not newly generated); Cultural Connectors |
| **Evidence & sources** (utility) | Data Signals / Signal Check section, research-depth metadata (agents/searches/tool calls), the Verifier panel (Part 5), attribution-tier legend |
| **Retired sections** (utility) | The Graveyard, renamed, demoted from the nav bar to the utility zone. Contents unchanged. Trusted Voices and all trust sections stay here pending Maria. Pre-R9 reports' Graveyard listings unchanged. |
| **Report inputs** (utility) | Existing inputs view + the manual-entry fields from Part 6 |

**Mapping honesty:** anything that fits no home cleanly gets flagged in your report, not force-fit and not dropped.

## Part 3: The Summary Page

One page a stranger can read and say "okay, I got it." Assembled **entirely from existing report data** — no new agent output. Blocks, top to bottom (mockup is the spec):

1. **Header:** audience name (serif), one-line tagline, meta line (date · verified · by Significant), stat boxes per Part 6.
2. **Intent router:** "Reading this as a brief? Prospecting → 02 · Awareness & placement → 03 · Messaging & creative → 04 · Content & participation → 05 · Partnerships → 06." Links switch chapters.
3. **01 block:** base summary (2–3 sentences distilled at render time from existing base-description content — template-assembled, not LLM-generated) beside the core card (coreName, tagline, the strongest coreVsBase line). "Reach them and the audience follows" framing.
4. **02 block:** signal chips in two visual classes — **core chips** (iris border: distinctive, whyOnlyThisAudience-backed) and **reach chips** (plain: the broad inventory) — with the two-class legend ("core signals — precise, trusted, cheap / reach signals — broad, scaled"). Top ~6 chips by strength.
5. **03 block:** two cards, In the world / Online — top 3 each from Go+habitat and social signals respectively.
6. **04 block:** two cards, What works / What backfires — top 3 drivers, top 3 barriers.
7. **05 block:** chip row of top engagement mechanics.
8. **06 block:** chip row of top adjacencies, each with its ~5-word bridge reason.
9. **Verdict strip** (dark bar, serif): the strategic-lever sentence **pulled from the existing Story's fourth beat** (strategic lever — it exists per the Round 8b floor). If extraction fails on a given report, omit the strip entirely — never synthesize a new sentence in the view layer.

Every block header carries "details in NN →". Selection for every block is deterministic (score/strength ordering + whyOnlyThisAudience flag), so the Summary is reproducible from report_json alone — same JSON, same Summary.

## Part 4: Two-Class Hierarchy + Scores as Words

1. **Featured selection (deterministic):** within a chapter's signal list, items with `whyOnlyThisAudience` populated, ordered by strength, cap 2 featured (3 only if a third is equal-strength distinctive). Everything else renders as collapsed rows: title + one-line + strength word, expandable to the full body and evidence.
2. **Evidence disclosure pattern:** every featured item and row body gets a "Show evidence ▸" disclosure rendering the existing validatedBy / reinforcingEvidence arrays with the mono source line (counts, attribution tier, verified mark). Provenance collapsed by default — present everywhere, shouting nowhere.
3. **Scores as words**, consistently: map existing numeric/tier scores to Strong / Moderate / Emerging (document the exact thresholds you choose from the current score distribution in your report; the mapping must be monotonic and used identically everywhere). Numbers stay available inside evidence disclosures — words outside, numbers within.

## Part 5: Verifier Display Recalibration (display only — zero logic changes)

Chronic 3–4 WARNs on honest runs read as alarms and aren't. New display tiering:

- **FAIL:** unchanged — prominent, red, absolute (any FAIL = not for external use, re-run).
- **WARN:** splits at render by existing warn category: integrity-relevant warns (leakage, genericity, attribution gaps) keep WARN styling; known-benign categories (derivation tolerance, designed-degradation all-empty-targetables) render in a **neutral "Notes" tier** — muted, in the Evidence & sources panel, excluded from the footer count.
- **Footer:** "✓ Verified · N integrity checks" when no FAIL and no integrity-relevant WARN; notes don't dirty it.

The category split is a render-side mapping over existing check IDs — the Verifier itself is untouched. List the mapping explicitly in code comments and your report.

## Part 6: Header Stats + Manual Platform Reach (the one small write path)

1. Three stat boxes with **basis labels**: Est. reach (existing coreSize/audience estimate · *triangulated*), Influential core % (· *evidence-based*), Platform reach (· *platform estimate*). A bare unlabeled number is a bug.
2. Platform reach ships as an **empty slot**: dashed box, "add from Ads Manager" state. Value comes from a manual field on the Report inputs page (platform name + value + date checked). Persist inside report_json (e.g. `manualInputs.platformReach`) via a minimal update endpoint — same no-auth email-attribution model as the rest of the app. This is deliberate slot-not-plumbing: if the field gets used by hand, 11C automates it; if not, we learned that cheaply.
3. No validation theater — store what's entered, render it with its basis label and date.

---

## What NOT to Change

- Agents, prompts, pipeline stages, tool budget/registry, schemas (the manualInputs JSONB field inside report_json is the only data addition)
- Verifier checks and severities — Part 5 is presentation only
- Chart internals beyond plate-framing legibility
- Pre-Round-9 reports' legacy rendering, and their Graveyard listings
- **No content generation in the view layer** — every sentence on screen traces to report_json; template assembly yes, LLM calls no
- The mockup's plan-preview section: 11B's, not yours

---

## Implementation Order

1. Part 1 shell + theme, routing all existing post-R9 content into placeholder chapter pages (nothing lost, possibly ugly) — commit.
2. Part 2 chapter-by-chapter mapping, checking each absorbed section off the table — commit per chapter.
3. Part 4 hierarchy + words-for-scores across chapters.
4. Part 3 Summary page (needs Parts 2+4's selection logic).
5. Part 5 verifier display split.
6. Part 6 stat slots + manual field + update endpoint.
7. Full pass on acceptance cases; report with the completed mapping checklist.

## Testing

0. **Acceptance case — the blessed Sep Home Crafters run:** every section that rendered in the old 8-tab UI is reachable in the new structure (walk the mapping table, check every row); the Summary reads as a self-sufficient one-pager; 12 social signals present (≤3 featured, rest rows); inventory layer intact with notes.
1. **Espresso 4a29a06e:** Home-Barista ~38K layer analysis, r/espressocirclejerk, Teamblind/Bogleheads crossover all readable in 02/03 — the Round 10 acceptance content survives the restructure.
2. **Degraded run 42c2fa0f:** graceful degradation preserved — partial inventory, no empty shells, muted unavailable-lines only where the layer is truly empty.
3. **Legacy:** a pre-R9 report renders its old layout untouched.
4. **Summary determinism:** render the same report twice — identical Summary. Verdict strip absent (not broken) on a report where story-lever extraction fails.
5. **Verifier display:** an honest run with derivation-tolerance warns shows "✓ Verified" footer + those warns as Notes; seed an integrity-relevant WARN and a FAIL into a copy — both surface with full prominence.
6. **Manual reach field:** enter a value on Report inputs → appears in the header stat with basis label + date; empty state renders the dashed slot; value survives reload (persisted in report_json).
7. **No-reduction audit:** diff the set of rendered data fields old-UI vs new-UI on the acceptance case — the new set is a superset. Include the diff in your report.
8. **Stranger test (manual, Simon):** someone who has never seen Sway reads only the Summary and can answer: who's the audience, who moves them, where would you spend first.
