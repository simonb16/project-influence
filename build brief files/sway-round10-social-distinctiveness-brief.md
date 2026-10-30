# SWAY Round 10: Completing the Behavioral Reorganization + Social Distinctiveness
## Claude Code Brief — v2 (clean rewrite; supersedes all prior versions of this brief)

---

## The Diagnosis (revised after the production diff)

Simon compared the Aug 19 Home Crafters report (pre-Round-9 schema) against the Aug 24 Home Espresso Enthusiasts report (post-Round-9) on production and found the real story, which overturned half the original diagnosis:

**Primary problem — Round 9 was implemented as replacement, not reorganization.** Maria's four buckets were meant, in her own words, as "just a simpler way to organize the same analysis." Instead, Round 9 generated *new* 3-4-item-per-bucket analysis and sent the existing sections to the Graveyard. The proof lives in the espresso report's data: `findability.platformConcentrations` contains outstanding, audience-peculiar material — Home-Barista.com down to named subforums with a ~38K-member layer analysis, r/espressocirclejerk flagged as an insider-identity marker, a Teamblind/Bogleheads/Slickdeals tech-worker crossover — and none of it renders anywhere a reader looks. Her mockup also listed ~10 compact observables per bucket (an inventory); we ship a highlight reel. The content wasn't lost by the pipeline; it was hidden by the reorganization.

**Secondary problem — Social selection drifts toward the interchangeable.** Softer than originally assumed (the espresso Social list has real gems — "the coffee nerd friend," "parameter-specific proof format" — alongside platform inventory), but the drift mechanisms are real: selection moved into Reconciliation's busy tool loop, type quotas reward category coverage, convergence bias promotes the obvious, and measurability leaks into selection. Parts 1-5 add counterweights at the selection stage. Nothing about the 6b architecture reverts.

---

## Build Summary

| | |
|---|---|
| **PRIMARY — Part 0** | The inventory layer: render existing findability/habitat data inside the four buckets. Maria's granularity restored. Retroactive to all post-Round-9 reports. No new research, no prompt changes. |
| **SECONDARY — Parts 1-5** | Social selection counterweights: swap-test mandate, spice license, quota relaxation, Verifier genericity audit, optional `whyOnlyThisAudience` field |
| **Riders (approved)** | Enrichment one-retry-on-failure · merge the stale verifier-snapshot-match-fix branch |
| **What doesn't change** | 6b architecture, scoring axes, tool budget, enrichment boundary. Schemas: one optional field only. UI outside the Behavioral tab's buckets. |
| **Explicitly out of scope** | Trusted Voices resurrection into Social (Maria checkpoint decision) · Behavioral-bucket *flavor* changes (her spec, her call — checkpoint) · the broader clarity/UX round (being designed separately) |
| **Acceptance case** | Aug 24 espresso report **4a29a06e** (run 1, has findability). The **42c2fa0f** re-run (enrichment outage, no findability) is the graceful-degradation test case. |

---

## Part 0: Complete the Round 9 Reorganization (PRIMARY — do this first)

**No new research, no new agent output. Surface existing data inside the buckets, per Maria's original intent.**

Each bucket gains a second layer beneath its analyzed signal items:

1. **The inventory layer** — a compact, chip/list-style rendering of existing report data mapped into its home bucket:
   - **What They Search** ← `findability.searchBehaviors` (the full query list, not 3 picks)
   - **What They Consume** ← digital entries from `findability.platformConcentrations`, rendered **with their notes** (the layer analyses — "~38K registered members generate…" — are the crown jewels; a platform chip without its note is amputation), plus consumption-shaped `targetableInterests`
   - **What They Buy** ← purchase-relevant `targetableInterests` + `inMarketBehavior` decision triggers, compact
   - **Where They Go** ← physical/local entries from `platformConcentrations` + `realWorldHabitat` contexts (name, type, strength — compact)
2. **Rendering:** analyzed signal items stay on top (the highlight layer); the inventory renders beneath as a visually lighter block (chips or tight rows, notes preserved). Target feel: Maria's mockup — roughly ten observables per bucket, with analysis layered above rather than replacing it.
3. **Bucket-boundary rule for ambiguous mappings:** digital = Consume, physical = Go — the same boundary the buckets already use.
4. **Mapping honesty:** items that fit no bucket cleanly stay where they are — do not force-fit. Affinity Adjacencies remains its own section at the tab's bottom.
5. **Retroactivity:** all post-Round-9 reports gain the inventory layer (the data exists in each; this is pure rendering). Pre-Round-9 reports keep their legacy layout untouched.
6. **Graceful degradation:** reports missing findability (enrichment-outage runs like 42c2fa0f) render whatever inventory sources exist (realWorldHabitat, inMarketBehavior) and omit the rest — no empty-shell chips, no placeholders. If the entire layer is empty, one muted line: "inventory unavailable this run (enrichment stage failed) — re-run for the full layer."
   - *Dependency note:* the bucket inventory now inherits enrichment's fragility — an enrichment failure costs visible report content, not just targetables. This is why the retry rider is part of this round.
7. **Graveyard tidy:** for post-Round-9 reports, the parked Findability section retires from the Graveyard listing (its content is home). It remains listed for pre-Round-9 reports.

---

## Rider A: Enrichment Retry

On Enrichment stage failure: one retry, then the existing graceful degradation (un-enriched signals, no findability, all-empty-targetables WARN) as the honest fallback. Non-fatal philosophy unchanged — the retry just makes the degraded run rare instead of occasional.

## Rider B: Stale Branch

Merge the outstanding `verifier-snapshot-match-fix` branch into this round's branch so it ships with the next deploy.

---

## Part 1: Calibrate from the archive (for the Social fix)

Before touching prompts, build the evidence set from BOTH sources:

1. **Pre-6b exemplars:** pull Social-layer content from a pre-6b report (Jul 30 era — old Influence Map + Digital Habitat). Extract 3-5 signals that fail the swap test below (candidates: "the 'just for me' anti-monetization identity", "WIP culture and candid imperfection", "producer story and process-specificity as proof format").
2. **Flattened-but-present evidence:** from the espresso runs, collect the distinctive raw material that research surfaced but selection buried or under-ranked (the anti-GAS counter-commercial identity, the against-interest dealer). This is proof the problem is ranking, not research — and these may be the stronger in-prompt exemplars.
3. Pick the 3-5 strongest as the DISTINCTIVE exemplars; add their distinctive strings to the leakage list per standing drift-guard rules (structure-not-content framing on each).
4. **Stop condition:** if the archive diff does NOT show the old era (or the buried espresso material) as clearly more distinctive than current output, halt and present the diff before any prompt changes — the Social package then gets tuned to the evidence, not the assumption.

## Part 2: The Distinctiveness Mandate (Reconciliation selection prompt)

```
THE SWAP TEST: Before finalizing your signal list, apply this test to each signal: "Could this exact signal, as written, appear in a report about a completely different audience?" A signal that survives the swap is inventory, not intelligence.

Your list must contain AT LEAST 4 signals that FAIL the swap test — signals that would be nonsense for any other audience: this audience's tonal codes, proof formats, identity rituals, named institutions, peculiar behaviors. The obvious platforms (the big subreddits, YouTube niches, newsletter ecosystems) are table stakes — include them, but they are the floor of the list, not its point. The report's value concentrates in the signals only this audience could produce.

For each swap-test-failing signal, populate whyOnlyThisAudience: one sentence naming what makes it peculiar to this audience.

DISTINCTIVE EXEMPLARS (register reference from real reports — match the specificity, not the content):
[insert the 3-5 exemplars selected in Part 1]
```

## Part 3: License for Spice (Reconciliation selection + scoring prompts)

```
A signal with no platform quant but vivid qualitative evidence MAY outrank a measurable one. Measurability is a property of the evidence, not of the signal's importance — do not let "can I score this precisely" leak into "should I select this." Score unquantifiable signals from evidence density and mark the basis evidence-classified, as the rules already allow.

Single-lens signals are admissible when the evidence is specific and vivid — label them with their convergence status honestly (the existing confidence machinery). A distinctive single-lens signal with real evidence beats a converged platitude.
```

## Part 4: Relax the Type Quota

Change "a mix of all three types" to: "types follow the evidence — a typical list has all three, but do not manufacture a signal to fill a type. An audience whose influence is overwhelmingly physical may produce few content signals, and that is a finding."

## Part 5: Verifier — Genericity Audit (new LLM check)

```
GENERICITY AUDIT: Read the socialSignals list. Assess: (a) do at least 4 signals fail the swap test (would be nonsense for another audience)? (b) could the list as a whole, with the audience name redacted, be attributed to the correct audience by a knowledgeable reader?
- Fewer than 4 swap-test failures → WARN naming the interchangeable signals
- List reads as fully interchangeable → FAIL
- whyOnlyThisAudience populated on distinctive signals with real reasoning → contributes to PASS
```

This is the genericity counterpart of the exemplar-leakage guard: leakage catches borrowed specificity; this catches missing specificity.

## Part 6: Schema (minimal)

Optional `whyOnlyThisAudience?: string` on SocialSignal. No other schema changes. (The field also sets up the future clarity round — distinctive signals are natural candidates for visual elevation — but no UI work for it now.)

---

## What NOT to Change

- The 6b ownership pattern, scoring axes, tool budget, enrichment boundary
- UI outside the Behavioral tab's buckets — Part 0 is the only UI work this round
- Anti-padding: the mandate is a selection pressure, not a fabrication license — a distinctive signal still needs real evidence. If the research genuinely surfaced fewer than 4 peculiar signals, the agent says so and the Verifier WARN is the honest outcome.
- Trusted Voices stay in the Graveyard pending Maria
- Behavioral-bucket analysis style stays per Maria's Round 9 spec — flavor questions go to the checkpoint

---

## Implementation Order

1. **Part 0** — mapping function + bucket inventory UI. Verify against **4a29a06e** first (acceptance case: the Home-Barista subforum notes, the ~38K layer analysis, r/espressocirclejerk, and the Teamblind/Bogleheads crossover must all be readable on the Behavioral tab). Then verify graceful degradation on **42c2fa0f**.
2. **Riders** — enrichment retry; merge verifier-snapshot-match-fix.
3. **Part 1** — archive diff + exemplar selection. Report findings. Honor the stop condition.
4. **Parts 2-4** — prompt changes + leakage-list additions.
5. **Parts 5-6** — schema field + Verifier check.
6. Full test run + review.

Build on branch `round10`; no merge or deploy without Simon's explicit go.

---

## Testing

0. **Acceptance case (Part 0):** report 4a29a06e's Behavioral tab shows all four buckets with BOTH layers — analyzed signals on top, full inventory beneath, every platformConcentration with its note. The Home-Barista ~38K analysis and the Teamblind/Bogleheads crossover are readable without visiting the Graveyard.
1. **Degradation case:** report 42c2fa0f renders partial inventory from what exists, no empty shells; the muted unavailable-line appears only if the layer is fully empty.
2. **Legacy case:** a pre-Round-9 report renders its old layout untouched; its Graveyard still lists Findability.
3. **New report (Home Crafters or wine):** ≥4 signals fail the swap test; whyOnlyThisAudience reads as real reasoning, not restated titles; platform inventory present but no longer the majority voice.
4. **Redaction test (manual):** the new Social list with the audience name removed — attributable by a knowledgeable reader? Compare against the same test on the last pre-Round-10 report.
5. **Spice license:** at least one signal is single-lens or evidence-classified with honest labeling — OR the summary explains why none qualified.
6. **Genericity audit:** runs honestly on the new report; seed a deliberately generic list into a copy and confirm WARN/FAIL fires naming signals.
7. **No fabricated peculiarity:** spot-check whyOnlyThisAudience claims against evidence — every peculiarity claim traces, same as every number.
8. **Enrichment retry:** force one failure — retry fires; force two — graceful degradation ships with the WARN.
9. **Exemplar hygiene:** new distinctive exemplars leakage-listed with structure-not-content framing.
