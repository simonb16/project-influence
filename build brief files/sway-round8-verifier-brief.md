# SWAY Round 8: Verifier Agent + Enrichment Split
## Claude Code Brief

*Scoped directly from your own Round 7 observations in the 6b summary. Two focused changes: automate the integrity checks you did by hand, and take the one synthesis seam you identified as lowest-risk. The full section-writer decomposition stays deferred per your recommendation.*

---

## Build Summary

| | |
|---|---|
| **New agent 1** | Verifier — hybrid code + LLM integrity checker, runs last, non-fatal, Sonnet 4.6 for the judgment checks |
| **New agent 2** | Enrichment — takes findability + signal targetables out of Synthesis; runs parallel with Synthesis/Periphery |
| **Pipeline** | 3 lenses → Reconciliation → [Synthesis ∥ Periphery ∥ Enrichment] → Verifier |
| **Also** | Tool budget raised 8 → 12 calls (job model removed the timeout fear) · Trends timeout 15s if not already merged · Reconciliation gains a `search_web` fallback tool (Reddit-gap coverage, same budget) |
| **What doesn't change** | Lenses, Reconciliation, report content, tab structure, localStorage schema (additive only) |
| **Success test** | Content diff ≈ zero vs current pipeline · Verifier catches seeded errors · synthesis latency drops |

---

## Part 1: The Verifier Agent

### Design principle: code first, model second

Most of the integrity checks from your shopping list are mechanical — implement those as plain code, not LLM calls. The model is reserved for the few checks that need judgment (matching paraphrased numbers, classifying honesty of basis statements). This makes the Verifier cheap, fast, and mostly deterministic.

### Inputs

The Verifier stage receives: the final assembled report JSON, reconciliation's raw output, the run's tool-call log entries (the audit log — this is why the 4000-char window fix matters), and the enrichment agent's output.

### Code checks (no LLM)

1. **Schema conformance** — socialSignals count 8-14; all three types present; WHERE and WHO non-empty on every signal; strength/scale present and in range; snapshot has 3-5 entries per box.
2. **validatedBy referential integrity** — every referenced dataSignal id exists; every metric quoted in a ✓ VALIDATED line appears verbatim in the referenced dataSignal.
3. **Enrichment zero-drift** — diff reconciliation's socialSignals against the final report's: scores, placements, types, count, where/who unchanged. (The merge guard already enforces this — the Verifier independently confirms and reports it.)
4. **Snapshot traceability** — every Signals Snapshot entry's label and score exist in its source section (emotional drivers, behaviors/triggers, susceptibility subsets or trusted voices, social signals/habitats).
5. **coreName coherence** — coreName appears in the influentialCore description or is consistent with coreLabel; snapshot center uses coreName.
6. **Exact-number log audit** — extract every numeric claim from dataSignals and validation lines; assert each appears in the tool-call log. Numbers found nowhere → flag.

### LLM checks (one Sonnet 4.6 call, all checks in a single pass)

7. **Paraphrase-tolerant number audit** — numeric claims in PROSE (reconciliation analysis, signal bodies, the Story) that reference platform data: does each trace to a logged tool result or clearly attributed lens evidence ("per Mintel", "documented by")? Distinguish tool-claims from lens-claims — lens-sourced numbers are fine when attributed, invented numbers are failures. (This is the check that would have caught things like the r/knitting "~893K members" question — the answer should be "lens-sourced, attributed, pass".)
8. **scaleBasis / strengthBasis honesty** — each either cites a real number (verifiable in logs or attributed lens evidence) OR explicitly self-identifies as evidence-classified ("no direct measure — classified niche from..."). Bases that state numbers with no source and no hedge → fail.
9. **Targetable-signal groundedness** — spot-check that targetables reference platforms/spaces the signal's evidence actually mentions; generic filler ("social media — engagement") → warn.

### Output schema

```typescript
interface VerifierReport {
  ranAt: string;
  checks: Array<{
    id: string;               // "schema-conformance", "number-log-audit", ...
    status: 'pass' | 'warn' | 'fail';
    detail: string;           // one line; on warn/fail, name the specific item
  }>;
  passCount: number;
  totalCount: number;
  summary: string;            // one sentence
}
```

### Behavior

- Runs as the final stage, after everything merges. **Non-fatal in both directions**: a Verifier crash ships the report without a verifierReport; failed checks ship the report WITH the failures visible. The Verifier informs — it never blocks.
- SSE: `{ step: "verifier", message: "Verifying report integrity..." }` → `{ step: "verifier-complete", message: "Integrity: 13/14 checks passed" }`
- Log the full check detail to agent.log regardless of UI display.

### UI

Minimal, footer-level. Extend the existing report meta line ("6 agents · analyzed Aug 11...") with "· ✓ 14/14 integrity checks". Clicking it expands a compact panel listing each check with status — pass rows muted, warn rows amber, fail rows red with their detail line. Old reports without verifierReport show the meta line unchanged. No banner, no badge anywhere else — this is quiet infrastructure, not a feature.

---

## Part 2: The Enrichment Agent (first synthesis seam)

Per your seam analysis: signals enrichment is the smallest, contract-bounded, already-merge-protected extraction — and its one cross-writer dependency (findability) resolves by moving findability production into the same agent.

### What moves out of Synthesis

1. **Findability** (the Behavioral tab section: targetable interests, search behaviors, platform concentrations, affinity adjacencies)
2. **Signal targetables enrichment** (the per-signal targetableSignals + optional body polish)

Synthesis's prompt drops both jobs entirely. Everything else stays.

### The Enrichment agent

- **Model:** Sonnet 4.6 (bounded, well-specified work — same tier as the lenses)
- **Batch:** runs in parallel with Synthesis and Periphery (all three consume reconciled output)
- **Input:** reconciled data (including socialSignals and the lens evidence summaries it already contains)
- **Output:** `{ findability, enrichedSignals }` — where enrichedSignals is reconciliation's socialSignals + targetableSignals per signal (+ polished body where genuinely improved)
- **Prompt:** reuse the existing findability prompt block and the existing enrichment prompt block (including the do-not-rescore rule) — moved, not rewritten. One addition: derive per-signal targetables and the findability section together so they agree (the findability section is the superset; per-signal targetables are its signal-specific projections).
- **Merge:** the route's existing mergeSocialSignals guard now takes enrichment's output instead of synthesis's. Same authority rule: reconciliation's fields win, drift is logged and overridden.
- **Non-fatal:** if Enrichment fails, ship with reconciliation's signals un-enriched (no targetables) and no findability section — same graceful-degradation pattern as Periphery.

### Expected wins (measure and report)

- Synthesis output shrinks (~24K tokens → meaningfully less) and its ~7.4 min stage should drop — report the before/after.
- The critical path may shorten if synthesis was the long pole and enrichment finishes inside its shadow.

---

## Part 3: Tool Budget + Trends Timeout

- **Raise the Reconciliation tool budget MAX_TOOL_CALLS from 8 to 12.** The 8-call cap was set defensively when single-connection timeouts were the operating fear; the Round 7 job model removed that constraint. Update the prompt's budget language to match ("maximum of 12 API tool calls"), keeping all the prioritization guidance. The extra headroom should flow mainly to placement-critical quantification (signal scale/strength lookups).
- Trends tool timeout 10s → 15s if not already merged (approved Aug 11 — likely shipped with 6b; check and skip if so). All other tools stay at 10s, one-retry-then-deregister unchanged.

---

## Part 4: Reconciliation `search_web` Tool (Reddit-gap fallback)

Reddit's API registration is still pending, and we will NOT hit Reddit's unauthenticated endpoints (terms violation while our registration is in review, and they bot-block anyway). Instead:

Add a **`search_web` tool** to the Reconciliation agent's toolkit, using the same web search infrastructure the lens agents already use.

- **Purpose:** targeted quant lookups for sources the APIs don't cover — especially Reddit while its API is pending (subreddit sizes, community existence, thread visibility via `site:reddit.com` queries).
- **Budget:** counts against the same shared cap (12 after this round's raise). No separate allowance.
- **Tool description guidance:** prefer the dedicated API tool when one exists for the source; search_web is the fallback for uncovered sources. Do not use it to re-verify what an API already answered.
- **Attribution:** results from this tool must be labeled search-sourced — never API-sourced — in any basis field, dataSignal, or prose citation. The Verifier's number-audit checks (7-8) distinguish tool-API numbers, search-sourced numbers, and lens-attributed numbers; search-sourced with attribution = pass, search-sourced dressed as API data = fail.
- **Sticky-failure policy:** same as other tools (one retry on timeout, deregister on hard failure).
- **Future:** when Reddit API keys land, the reddit tool self-activates (existing env-gated registration) and the tool-choice guidance automatically demotes search_web for Reddit lookups.

---

## Backward Compatibility

- `verifierReport`, and enrichment-produced fields, are optional — old reports render unchanged.
- A report generated mid-failure (Enrichment down) renders with signals but no targetables — the UI already tolerates absent targetable rails from the 6a transitional era.
- No changes to any existing JSON key.

---

## Implementation Order

1. **Trends timeout** (Part 3) — one line, unless already merged
2. **search_web tool** (Part 4) — wrapper, registration, tool-choice + attribution prompt guidance
3. **Verifier code checks** (Part 1, checks 1-6) — pure functions over report + logs; unit-test them with fixture data
4. **Verifier LLM checks** (checks 7-9) — single Sonnet call; then the stage wiring, SSE, and footer UI. Include the search-sourced attribution category in checks 7-8.
5. **Seeded-error test** — before moving on: deliberately corrupt a copy of a real report (change one validated metric, blank one WHO, add an unattributed number to a body) and confirm the Verifier flags each. A verifier that's never seen a failure is untested.
6. **Enrichment agent** (Part 2) — extract prompts, wire the batch, repoint the merge guard, trim synthesis's prompt
7. **Diff test** — run the full pipeline on Home Crafters; compare against the 6b report: content should be equivalent in structure and quality (not identical text — models vary — but same sections, same signal count/scores, targetables of the same specificity). Watch for at least one sensible search_web use (e.g., a Reddit size lookup) with correct search-sourced attribution.
8. **Latency + output measurements** — report synthesis before/after size and stage timings

---

## Testing

1. **Verifier on the last good report** — run it against the Aug 11 Home Crafters data: expect all-pass (or explainable warns). Any fail on a report we manually verified = Verifier bug.
2. **Seeded errors** — each of the three corruptions above is caught, correctly classified pass/warn/fail, with the specific item named in detail.
3. **Verifier non-fatality** — kill the Verifier mid-run (throw in the stage): report ships, no verifierReport, no error surfaced to the user beyond a log line.
4. **Enrichment parity** — diff test per implementation step 6; zero drift on reconciliation-owned fields (now guarded against enrichment instead of synthesis).
5. **Enrichment failure** — force it to fail: report ships with un-enriched signals, no findability, Behavioral tab renders without the section, no errors.
6. **Latency** — measure the critical path vs 6b's 18.2 min baseline; report where it moved.
7. **Footer UI** — meta line shows the check count; panel expands with per-check rows; old reports unchanged.
8. **Full summary** — include before/after synthesis output sizes, stage timings, and any new Round-7-style observations (the next decomposition candidate is the Round 4 signal-depth sections — note anything you learn that affects that).
