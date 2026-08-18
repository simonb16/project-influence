# SWAY Round 8b: Output Quality Bake-Ins
## Claude Code Brief

*Origin: the Aug 17 Home Crafters run (report id 879412ab…) produced the best output register Sway has shown — some of it caused structurally by Round 8, some of it the model out-performing its spec. This round codifies that run's best moves as **floors** so future runs can't fall below them. All exemplars below are verbatim from that report; embed them in the prompts as in-prompt exemplars.*

*Note: some of these amendments may already have been applied from chat instructions during the Round 8 merge conversation. Treat this brief as canonical — verify each item exists as written here and reconcile any partial versions. Apply on the round8-verifier branch if unmerged, otherwise on main.*

---

## Build Summary

| | |
|---|---|
| **What this is** | Prompt/spec amendments + one UI label + two small fixes. No architecture changes. |
| **Agents touched** | Synthesis (story spec, profile contrast spec), Reconciliation (participation layers, snapshot trust mechanism), Enrichment (targetable layer/mechanism spec), Verifier (attribution pass policy) |
| **Principle** | Exemplar-anchored floors, not ceilings — structure guaranteed every run; prose brilliance still allowed to vary |
| **Anti-padding rule applies throughout** | Every spec below is evidence-gated: layers, mechanisms, and quant appear when evidenced, never invented to satisfy the format |

---

## Part 1: The Story — structural spec (Synthesis)

Add to the synthesis prompt's story instructions:

```
THE STORY must accomplish four things, in roughly this order:
(a) Name the core↔base relationship and how influence travels between them
(b) Cite 2-3 quantified markers from the reconciled data, woven into the argument (not listed)
(c) Name the trust mechanism — what earns belief in this category
(d) Close with the strategic lever: the implication a brand should act on

EXEMPLAR of the register (from a real report — match its structure, not its content):
"The home-crafting category is decided by a small (5–15%), stable core of multi-year hobbyists who make purchase verdicts inside communities — knit nights, Ravelry logs, subreddit advice threads, Substack comments — that retailers merely fulfill. Their trust grammar is fixed: granular specificity plus candid flaws plus zero commercial stake, and their defining identity position is refusal to monetize ('just for joy'), held against a monetization pull that is rising (+37% 'how to sell crochet') and dominates algorithmic video. The lever is not reach but proximity: no brand currently articulates the no-hustle position back to them, and the core's habitats — intimate text, micro-video, and physical circles — are cheap to be present in and impossible to buy your way into."
```

## Part 2: Targetable Signals — layer + mechanism spec (Enrichment)

Add to the enrichment prompt:

```
Each targetable signal should, where evidence allows, include:
- The LAYER to target — not just the platform but the segment within it ("the ~3% posting layer", "high-karma, long-account-history contributors in advice and WIP threads")
- The MECHANISM — why this parameter finds the core rather than the base ("queries that route organically to subreddit threads are a proxy for the contributor-layer audience")
- DURABILITY/SEASONALITY when trend data exists ("durable local-discovery intent (stable −5% YoY) with pronounced Nov–Feb seasonal peak")

EXEMPLARS (verbatim from a real report):
- "Subreddits r/crochet, r/knitting, r/crafts — filter to high-karma, long-account-history contributors in advice and WIP threads; these are the ~3% posting layer where the core concentrates"
- "Search terms 'stash busting crochet', 'WIP accountability knitting', 'yarn store near me' — queries that route organically to subreddit threads are a proxy for the contributor-layer audience"

Anti-padding: layer and mechanism only when evidenced — never invent segmentation to satisfy the format. A plain platform+parameter targetable is acceptable when that's all the evidence supports.
```

## Part 3: Core-vs-Base Contrast — spec + UI label (Synthesis + UI)

The influentialCore `profile` field (rendered as the indented/grey second paragraph of THE INFLUENTIAL CORE) becomes an explicit contrast:

```
PROFILE = THE CORE-VS-BASE CONTRAST. Systematically contrast the core against the base across the evidenced axes — typically: identity stance, discovery mode, purchase behavior, monetization posture, and role in the recommendation flow. Use quant where it exists. Only include axes with real evidence.

EXEMPLAR (verbatim from a real report):
"The knit-night regular differs from the base on nearly every axis. The base samples crafting through kits, craft-and-sip nights, and aesthetic trends (grandmacore, cottagecore); the core never mentions kits and explicitly rejects crafting-as-identity ('something I do, not something I am'). The base's monetization curiosity is rising (+37% on 'how to sell crochet'); the core is a counter-current inside its own audience, using refusal as a badge. The base consumes recommendations; the core produces them, in a format — specificity plus visible imperfection plus no commercial stake — that the base copies when learning how to evaluate products."
```

**UI:** give the block a mono eyebrow label: **"HOW THEY DIFFER FROM THE BASE"**. Old reports render the same block with the same label (their profile text is close enough in spirit; no data changes).

## Part 4: Participation Layers (Reconciliation)

Add to the reconciliation prompt's signal instructions:

```
PARTICIPATION LAYERS: when community data supports it, distinguish the participation layers within a community (contributor vs visitor/lurker) and state which layer the core occupies — with the ratio when derivable from real numbers.

EXEMPLAR (verbatim): "The contribution layer (~13K weekly contributions against 411K weekly visitors on r/crochet alone) is where the core operates; the visitor layer is the base receiving its judgment." — with the derivation shown transparently in the validation data (members from web search + visitor/contribution figures from lens evidence → "~3% contribution rate").

Evidence-gated: layer analysis only where numbers exist. Never estimate a ratio without inputs.
```

## Part 5: Snapshot Trust Entries — mechanism-first (Reconciliation/Synthesis, wherever snapshot trust derives)

```
Snapshot TRUST entries name the trust MECHANISM, not just the archetype — with an evidenced exemplar in parentheses where one exists.
EXEMPLAR: "Knit-night regulars & LYS staff — named-person, zero-stake in-person recommendation ('Sue') · 92"
Named individuals only when the evidence produced them (anti-confabulation unchanged).
```

## Part 6: Hero Size-Line Fix (UI)

The hero currently renders "5-15% of self-identified crafters **of audience**" — the template appends "of audience" to a `coreSize.estimate` that already carries its own denominator (same artifact on the Aug 14 report: "…crafting population of audience").

**Fix:** render `coreSize.estimate` verbatim; append "of audience" ONLY when the estimate is a bare percentage ("5-15%" → "5-15% of audience"; "5-15% of self-identified crafters" → unchanged).

## Part 7: Verifier — Attribution Pass Policy

Per the live-run analysis (the 7/9 footer): the derivation-tolerance fix already shipped (derived-looking unmatched numbers → WARN deferring to the LLM audit; bare unmatched → FAIL). One further calibration, approved:

```
The paraphrase-number-audit (LLM check) should PASS clearly-attributed lens/source numbers outright — a number with a named source ("per Mintel", "Ravelry's reported 1M MAU", "(search-sourced)", "per web search") is acceptable by the rules and should not warn. Reserve WARN for genuinely ambiguous sourcing: numbers with vague attribution ("research shows", "reportedly") or attribution that doesn't name a checkable source. Bare unattributed numbers remain the FAIL signal (code check).
```

Rationale: warn-on-every-attributed-number makes ⚠ the default footer state, and a warning that always fires is noise that trains the team to ignore the one that matters. The footer should read clean (✓ N/N) on an honest report.

---

## Part 8: Drift Guards

Codifying exemplars creates four drift risks; this round ships the mechanical guards, and the workflow guards are logged on the roadmap:

1. **Exemplar-leakage check (Verifier, new code check).** Maintain a small list of distinctive n-grams from every in-prompt exemplar (e.g., "trust grammar", "knit-night regular", "+37%", "~3% posting layer", "'Sue'", "impossible to buy your way into"). The Verifier greps each new report for them: any hit in a report about a DIFFERENT audience → FAIL naming the leaked phrase; hits in a same-audience re-run → WARN (may be legitimate re-discovery, but visibility matters). Update the list whenever an exemplar is added or swapped — make it a constant next to the exemplars so they can't drift apart.
2. **Structure-not-content framing on every exemplar.** Already present in Parts 1-5 — verify each exemplar is introduced with explicit "match the structure/register, not the content" language.
3. **One-exemplar rule.** Each spec carries exactly one exemplar. Future harvests REPLACE exemplars, never append. (When a report from a different audience produces an equally good exemplar, swapping to it — or alternating domains across specs — reduces content anchoring; note this option in a code comment.)
4. **Anti-padding as the Goodhart guard** — already present in every Part; do not weaken any of those clauses while implementing.

Workflow guards (no code, logged on roadmap): harvest reviews consolidate prompts rather than accumulate; each harvest review also asks "did anything EXCEED the floor?" — a harvest that finds nothing new is the sign the floor has become a ceiling.

---

## What NOT to Change

- Architecture, schemas, pipeline, models — untouched. This is prompts, one UI label, two small fixes.
- Anti-confabulation and anti-padding rules — reinforced by every part above, never relaxed.
- Historical verifierReports — stored reports keep the verdicts recorded at generation time.

## Testing

1. Run one full report. Check: story hits all four spec beats; profile paragraph reads as systematic contrast under the new label; at least one targetable carries layer+mechanism (if evidence allowed); participation-layer analysis appears where community numbers existed; snapshot trust entries name mechanisms.
2. Verify the size line renders without the doubled denominator on both the new report and the Aug 14/Aug 17 stored reports.
3. Verifier: the new report's footer should read ✓ clean (assuming honest content) — attributed lens numbers passing, derived numbers warning at most. Re-run the seeded-error corruptions to confirm FAILs still fail.
4. Anti-padding spot-check: no invented layers/mechanisms/ratios — every new-format element traces to evidence.
5. Leakage check: run a report on a NON-crafting audience (e.g., the natural wine example) — zero exemplar n-grams should appear; then seed one ("trust grammar") into a copy and confirm the Verifier FAILs it by name.
