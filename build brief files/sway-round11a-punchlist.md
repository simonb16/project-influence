# Round 11A — Review Punch List
## Follow-up directive, branch `round11a` · reviewed against the Oct 29 SMB leaders report (c0835162)

Verdict first: the architecture landed — briefing, not cockpit. Chapter 02 is the best page Sway has rendered. Everything below is view-layer polish except item 0, which is a pipeline norm, not a bug.

---

## 0. Re-run the SMB report (FAIL — working as designed, no code change)

The exemplar-leakage guard FAILed the Oct 29 run: "~3% posting layer" (the Home Crafters r/crochet exemplar phrase from the 8b floors) appears twice in Chapter 02's Reddit targetables. The report's own data contradicts it (~65 posts/day vs 2.55M members). The guard, the red footer, and the withheld "✓ verified" mark all behaved correctly. Per the README norm: re-run before external use. No calibration change — this is the guard succeeding. Re-run after shipping the fixes below so the new run also validates them.

## 1. Summary subtitle — stop reusing the Story's opening sentence

The page subtitle currently renders the Story's dense first sentence (60 words, stats included) as the tagline, while the verdict strip renders the Story's last sentence. The subtitle must be a true one-liner: the audience in a sentence. Source preference: a dedicated tagline field if one exists in report_json; otherwise the shortest declarative clause of the base description (template extraction, no LLM); otherwise omit. The verdict strip keeps the lever sentence — that part is right.

## 2. Summary block 05 renders the wrong field (bug)

The chips show entry-point *category labels* (ritual · community · voice · moment · context) instead of content. Fix: chip = the entry point's short title (e.g. "The monthly peer-advisory cycle", "The pricing-betrayal switching moment"), top items by strength, same pattern as the other blocks. Chapter 05 itself is correct.

## 3. Chapter 03 "In the world" — dedup on merge (bug)

The section concatenates the Go bucket and real-world habitat without deduplication: Vistage/EO/TAB, SBDC/SCORE, and the 10KSB Summit each render twice. Merge by normalized name/entity match; when both sources describe the same place, render once, keeping the richer note (or union of notes), consistent with the inventory-note rule. The two phrasings of the same venue are one venue.

## 4. Chapter 01 base block — never render raw run input as report prose

"The base — how they behave" opens with the user's verbatim audience input (lowercase, typos intact) styled as content. Raw inputs live on Report inputs only (where they correctly appear). The base narrative must come from lens-derived material already in report_json; the three evidence bullets below it are fine and stay. If no lens base-description exists for a given report, render the bullets alone — no fallback to the input text.

## 5. Verifier footer arithmetic — notes are not warns

Footer reads "7/11 checks passed (1 failed, 3 warned)" while the Notes section declares notes excluded from the footer count. Make the display consistent: count only FAIL/WARN/PASS tiers in the X/Y line and warn count; render notes as a separate suffix, e.g. "7/9 checks passed (1 failed, 1 warned) · 2 notes". Display only — check logic untouched.

## 6. Small polish

- **06 summary chips truncate mid-sentence** ("…structurally motivated to build…"). Chips carry a short bridge-reason (≤ ~8 words, first clause or a trimmed phrase, no dangling ellipsis mid-word); full sentences live in the chapter rows.
- **"absorbs: …" annotations are visible in the client-facing view.** Keep them, but gate behind a dev flag (env or query param) — they're internal mapping provenance, not reader content. Same gate for the Cultural context page's "provisional home" banner? No — that banner stays visible; it's honest reader-facing context. Only the "absorbs:" lines gate.

## 7. Deferred to Simon (no action unless he says so)

- Signal Map renders on a light plate; the mockup specced dark. Awaiting his aesthetic call — do not change preemptively.

---

## Acceptance

1. Fixes 1–6 verified on the existing c0835162 report (they're all render-side).
2. Fresh SMB re-run (item 0): passes leakage (or honestly FAILs on new grounds), Summary shows a one-line subtitle, block 05 shows real entry points, Chapter 03 has no duplicate venues, Chapter 01 contains no raw input text, footer arithmetic consistent.
3. Spot-check the blessed Home Crafters report for regressions on items 1–4 (its data shape differs — e.g. confirm the base-block fallback and dedup behave).

No merge or deploy without Simon's explicit go.
