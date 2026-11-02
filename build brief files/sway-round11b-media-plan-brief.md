# SWAY Round 11B: The Walk Deliverable — Media-Plan Scaffold
## Claude Code Brief

**Branch:** `round11b`, cut from `round11a` (11A is unmerged by design — Simon wants both validated locally before committing to main). **No merge or deploy without Simon's explicit go.**

**Context files:** `sway-activation-whitepaper.md` (the walk tier this implements) · the 11A build (the plan lives inside its chapter structure).

---

## What This Round Is

The report currently ends at understanding. This round gives it an ending that is an *action*: a media-plan scaffold — the "walk" tier from the Activation white paper — that turns the report's signals into plan lines a media buyer can take to their platforms. It is the simple branch's actual deliverable: audience → core → signals → **plan**.

**The authorship boundary (explicit, checkpoint-pending):** this is a *scaffold*, not a finished media plan. It proposes lines, roles, sequencing, and a split hypothesis with evidence-backed rationale. It does NOT assign budget dollars, flighting dates, or creative. That boundary is a live Maria-checkpoint question; until she moves it, we stay on this side of it.

---

## Build Summary

| | |
|---|---|
| **Part 1** | Schema + synthesis: a `plan` object generated at synthesis time, evidence-gated, every line traceable to an existing signal. Rider: `audienceTagline` field in the same synthesis touch. |
| **Part 2** | The Plan page: new chapter "07 The plan" + the compact plan-preview table in Chapter 02 |
| **Part 3** | Core-seed vs reach line classes; per-line manual `addressableReach` fields (slot-not-plumbing) |
| **Part 4** | The split hypothesis block |
| **Part 5** | Sequencing, messaging inputs, measurement signals |
| **Part 6** | Verifier extension: plan-traceability check; plan text included in leakage + genericity scans |
| **What doesn't change** | Lenses, Reconciliation, Enrichment, tool registry/budget; 11A's structure and rules (Prime Rule still binding); Verifier severities |
| **Explicitly out of scope** | Platform API reach lookups (11C) · base-reach research (11C — the reach side ships honestly thin) · PDF/export (activation crawl, later) · budget dollars, flighting, creative (authorship boundary) · live platform push (run tier, deferred) |

---

## Part 1: The `plan` Object (synthesis addition — the round's only pipeline change)

Synthesis gains one bounded output section. Keep it small; watch the token ceiling (synthesis was ~50% of 48K at last measure — report the new figure).

```
plan: {
  soWhat: string,                  // one sentence: what this plan does that a generic plan can't
  splitHypothesis: {
    coreSharePct: { low, high },   // proposed band, default reasoning starts at 10–25
    rationale: string,             // WHY for THIS audience, grounded in channel costs/access
    status: "hypothesis"           // literal — rendered as such; a live test resolves it
  },
  lines: PlanLine[],
  sequencing: string[],            // ordered phases, "win the core first" as structure
  messagingInputs: string[],       // from existing drivers/backfires — inputs, not copy
  measurementSignals: string[]     // what to watch to know it's working
}

PlanLine: {
  channel: string,                 // e.g. "Newsletter sponsorships (candid operator tier)"
  role: "core-seed" | "reach",
  targetingStack: string,          // assembled from targetable signals — platform-enterable language
  rationale: string,               // one sentence, evidence-grounded
  sourceSignalIds: string[],       // REQUIRED, non-empty — the traceability contract
  doAvoid?: string,                // channel-specific do/avoid from existing evidence
  reachBasis: "platform estimate (Meta)" | "platform estimate (TikTok)" |
              "search demand/mo (Google)" | "reach plan (YouTube)" |
              "publisher-reported" | "membership-reported" | "unestimated"
}
```

**Rules for the synthesis prompt:**
- Every line derives from signals already in the report — `sourceSignalIds` is the contract, and a line that can't name its sources doesn't exist. No new research, no invented channels.
- Core-seed lines come from distinctive/core signals (the whyOnlyThisAudience and strength winners); reach lines come from the broad inventory (the swap-test "table stakes" the reports already carry). Expect few reach lines and say so honestly in the plan — the reach side thickens in the base-reach round.
- **No reach numbers.** The model never estimates audience sizes for lines — `reachBasis` labels what kind of number belongs there; the number itself arrives via manual entry (Part 3) or a future round. A plan line with an invented reach figure is a FAIL-grade offense (Part 6).
- Anti-padding as always: fewer honest lines beat a padded grid. Spice license applies — a vivid, evidence-dense niche line (a festival, a 40K newsletter) is exactly the point of the core-seed class.
- Exemplar discipline: if you add any in-prompt exemplar for plan register, it follows the 8b drift rules including the new anti-borrowing line, and its distinctive strings go on the leakage list.

**Rider — `audienceTagline`:** same synthesis touch adds a top-level `audienceTagline` field: the audience in one plain sentence, no statistics, no jargon — written for the hero position of the Summary. Render it as the Summary subtitle (the 11A punchlist deleted the extraction hack; this is the real fix). Old reports without the field keep the bare hero.

**Retroactivity:** none — the plan is generated at synthesis time. Old reports render the Plan page as an empty state: "The plan is generated at run time — re-run this audience to produce one." No backfill, no fake plan from stale JSON.

## Part 2: The Plan Page + the Chapter 02 Preview

1. New sidebar entry after 06: **07 The plan** (same chapter treatment: kicker, serif title, tagline "From signals to spend — where to show up first, and why", use-note "Use this chapter to take the report to your platforms.").
2. Page structure, top to bottom: the `soWhat` sentence (serif, prominent) → split-hypothesis block (Part 4) → **Core-seed lines** table → **Reach lines** table → sequencing → messaging inputs → measurement signals. Line tables: channel · role chip (iris CORE SEED / plain REACH) · targeting stack · reach (value + basis label, or the dashed "add from platform" empty state) · expandable rationale with "Show evidence" sourcing via `sourceSignalIds`.
3. **Chapter 02 preview:** the compact plan-lines table from the mockup finally ships — top 3–4 lines, role chips, reach column, linking to 07. (The mockup's teaser was explicitly out of 11A scope; this is its round.)
4. The intent router on the Summary gains "Planning spend → 07" and the Summary gets a one-line 07 block (the `soWhat` sentence + line count by class) above the verdict strip.

## Part 3: Manual Reach per Line (slot-not-plumbing, again)

Extend the 11A `manualInputs` pattern: each plan line accepts a hand-entered reach value + date via the Report inputs page (listed per line) or inline on the Plan page (pencil affordance). Stored in `manualInputs.planReach[lineId]`, rendered with the line's `reachBasis` label and date. Same rules: no validation theater, no auth change, persisted in report_json. The header's platform-reach stat (11A) may sum NOTHING — it stays a single-platform manual value; plan-line values are per-line only. Numbers from different platforms never aggregate (overlapping humans).

## Part 4: The Split Hypothesis Block

Rendered as the plan's thesis, not a settings panel:
- The proposed band (e.g. "15–20% of spend to core-seeding") in serif, with `status: hypothesis` rendered honestly: "a starting hypothesis — resolved by testing, not asserted."
- The rationale paragraph beneath (channel-cost grounded: a core reachable through $50 sponsorships costs little to saturate — the split is an output of channel economics, not a magic ratio).
- A manual override field (`manualInputs.splitOverride`, with a note field) for when a human planner adjusts it — rendered as "adjusted by [email] · [date]" beside the original hypothesis, which stays visible. The system's proposal is never silently overwritten.

## Part 5: Sequencing, Messaging Inputs, Measurement

- **Sequencing:** ordered phases with "win the core first" as the structural default *where the evidence supports it* — if an audience's evidence argues otherwise, the plan says so (structure follows evidence, not dogma).
- **Messaging inputs:** assembled from 04's drivers and backfires — explicitly labeled *inputs for creative, not copy* (authorship boundary + Maria owns the content layer per the July decision). Checkpoint note: depth here is capped until Maria's Motivational/messaging definition lands.
- **Measurement signals:** what a buyer watches per line class (core-seed: engagement quality, community echo, branded-search lift in restraint/insider vocabulary; reach: standard platform metrics) + a UTM naming suggestion per line so the future benchmark test has clean joins. No analytics integration this round.

## Part 6: Verifier Extension

1. **New code check — plan-traceability:** every PlanLine's `sourceSignalIds` resolve to existing signals; every line's channel/targeting content is consistent with its sources (string-level sanity, not semantics). Missing/dangling sources = FAIL.
2. **New code check — no-invented-reach:** any numeric audience-size figure inside plan fields that doesn't trace to a tool result, a source-attributed figure, or a manual input = FAIL. (This is the plan-specific sharpening of the existing number audit.)
3. The plan's text is included in the existing exemplar-leakage scan and the genericity audit (a generic plan for a distinctive audience is the failure mode: "could this plan, as written, serve any audience?" — the swap test extended to spend).
4. Footer/tiering per 11A Part 5 unchanged.

---

## Implementation Order

1. Part 1 schema + synthesis prompt (+ tagline rider); run once; inspect the raw `plan` JSON before any UI. Report the synthesis token figure.
2. Part 6 verifier checks (they gate everything after).
3. Part 2 pages + preview + router/Summary additions.
4. Parts 3–4 manual fields.
5. Part 5 sections.
6. Full test pass; report.

## Testing

0. **Acceptance:** fresh SMB run — plan present; every line traces (click every "Show evidence"); zero reach numbers anywhere except manual entries; core-seed lines are recognizably the distinctive signals turned into placements; reach lines honestly few with the thin-side note; `audienceTagline` renders as a clean one-liner in the hero (the "Still shortlists on review platforms" class of fragment would be a failure — it should read like a sentence written for a human).
1. **Swap test on the plan:** redact the audience name — a knowledgeable reader should attribute the core-seed lines to this audience. If they could serve anyone, the genericity audit should have caught it; verify it does on a seeded-generic copy.
2. **Split block:** hypothesis + rationale render; manual override shows attribution and never hides the original.
3. **Manual reach:** per-line entry persists, renders with basis + date; nothing aggregates across platforms.
4. **Old reports:** Plan page shows the re-run empty state; no crashes, no fake plans; Summary 07 block absent.
5. **Verifier:** seed a dangling sourceSignalId and an invented reach figure into a copy — both FAIL by name. Honest run passes with the plan included in scans.
6. **Ceiling watch:** synthesis output tokens before/after — if the plan pushes synthesis near the 48K ceiling, flag it; the decomposition trigger from Standing Threads may fire.
7. **Authorship boundary:** nothing in the rendered plan assigns dollars, dates, or creative copy.
