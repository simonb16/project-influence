# SWAY Round 7b: Light Restyle — Fonts & Colors Only
## Claude Code Brief

*Reference: the Significant company deck design (Wella proposal). Goal: less technical, more human. This is strictly a fonts-and-colors round — **zero UX, layout, structure, or data changes.** Every component keeps its exact position, size relationships, and behavior; only its skin changes.*

---

## Build Summary

| | |
|---|---|
| **Fonts** | Xanh Mono (headings, eyebrows, labels, scores — regular + italic, Google Fonts) · Hanken Grotesk (body, UI text — Google Fonts) |
| **Theme** | Full light: warm bone backgrounds, ink text, taupe/blush/lavender/plum accents |
| **What changes** | Design tokens (colors, fonts), chart/bar re-toning for light backgrounds, email template colors |
| **What doesn't change** | EVERYTHING else — layout, components, tabs, interactions, data, copy |
| **Replaces** | The 6a type system (Instrument Sans + JetBrains Mono) and the dark indigo theme |

---

## Part 1: Typography

New two-font system, replacing Instrument Sans + JetBrains Mono via the same `next/font` + Tailwind token wiring:

- **Xanh Mono** (`next/font/google`) — takes over BOTH current heading and mono-label roles:
  - Display headings (report title, coreName hero, tab-content section titles)
  - All letterspaced small-caps eyebrows and labels (SIGNALS SNAPSHOT, WHERE, STRENGTH, type badges)
  - Scores and numbers (it's monospaced — digits align exactly as JetBrains Mono did)
  - Its *italic* for the few voice-of-the-report moments: the coreTagline under the hero name, and blockquote-style callouts
- **Hanken Grotesk** (`next/font/google`) — all body copy, descriptions, buttons, form fields, list text.

**Critical constraint: Xanh Mono has NO bold weight** (regular + italic only). Do not let the browser synthesize bold — it looks smeared. Hierarchy comes from SIZE and LETTERSPACING, not weight: bigger for headings, letterspaced-uppercase-small for eyebrows (the current pattern already works this way). Audit for any `font-bold` applied to mono elements and replace with size/case treatments. Hanken Grotesk has full weights — body emphasis uses it normally.

Keep current sizes and spacing rhythm — same hierarchy, new faces.

---

## Part 2: Color System

Full light theme. Define as design tokens (CSS variables / Tailwind theme) and swap — components reference tokens, not raw colors. Target palette from the company deck:

```
--bg:            #EDEBE6   /* warm bone — page background */
--surface:       #F6F4F0   /* cards, panels */
--surface-2:     #FFFFFF   /* elevated cards where needed */
--ink:           #23201E   /* primary text */
--ink-soft:      rgba(35,32,30,.62)
--ink-faint:     rgba(35,32,30,.38)
--line:          rgba(35,32,30,.14)   /* borders, dividers */

--taupe:         #A99B8F   /* warm neutral accent */
--blush:         #D8C7BC   /* soft warm accent */
--lavender:      #C3BCE3   /* the one cool accent */
--plum:          #57525A   /* charcoal-plum — dark accent, chips, emphasis blocks */
--plum-deep:     #3E3A42   /* hover/active states of plum */
```

Accent-role mapping (replacing today's indigo/purple):
- Primary accent (links, active tab underline, primary buttons, section-header color): **plum**, with lavender for hover/secondary states
- The "Generate Influence Report" button: plum background, bone text
- Info/validated ticks (✓ VALIDATED): a muted olive-green derived to sit with this palette (approx `#7A7D5C` family) — NOT today's bright green
- HIGH badges, DIRECTIONAL tags: plum text on blush background (chips), or ochre `#B8933E` where a warning-ish tone is needed

### Data-vis re-toning (the careful part)

Charts and bars were tuned for dark backgrounds; on bone they need re-derived tones with real contrast:

- **Signal type triad** (content / digital / physical) — must stay instantly distinguishable AND palette-coherent. Use: content = deep lavender-plum `#8B7FB8`, digital = slate-blue `#6E87A0` (cooled taupe family), physical = ochre-tan `#B8933E`. Verify distinguishability and AA contrast against `--surface`; adjust within these families as needed.
- **Score/intensity bars**: single-hue ramps, not traffic lights — taupe→plum ramp for standard intensity; reserve the red family entirely (nothing in this palette is red; alarm-coloring reads technical).
- **Signal Map / rings / quadrant (Graveyard)**: dots and segments re-toned to the triad above; grid lines `--line`; corner/axis labels `--ink-faint` in Xanh Mono.
- **Snapshot boxes, emotional driver bars, trust weight bars**: same ramp logic.
- General rule: on light backgrounds, colored text must darken (AA contrast ≥ 4.5:1 for body sizes); test every colored-text token.

### The dark remnant

Nothing stays dark. The Graveyard tab keeps its muted treatment via `--ink-faint` text and `--bg`-toned cards, not via dark backgrounds.

---

## Part 3: Touch-points Checklist

Apply tokens everywhere — the render surface is bigger than the report:

1. Landing page (form, example cards, previous-reports list, in-progress badges)
2. All 9 report tabs including Graveyard
3. Progress view + the close-this-window notice
4. Inputs modal, migration banner, delete confirm context
5. **Email templates** — completion + failure emails get the palette (bone background, ink text, plum button/link). Keep them simple table-HTML; email clients are hostile.
6. Favicon/logo mark if it references the old indigo — re-tone to plum.

---

## What NOT to Change

- **Any layout, spacing structure, component arrangement, or interaction** — a screenshot diff should show identical geometry with different paint
- Copy/text content — nothing reworded
- Data, schemas, prompts, pipeline — untouched (this round doesn't even need the pipeline to run)
- No dark-mode toggle — one theme, light, like the deck

---

## Implementation Order

1. Fonts wired (Xanh Mono + Hanken Grotesk), token layer defined
2. Global surfaces + text (backgrounds, ink scale, lines)
3. Accent roles (buttons, tabs, links, chips, badges)
4. Data-vis re-toning (triad, ramps, charts) — the slow careful part
5. Peripheral surfaces (landing, progress, emails, banners)
6. Full visual pass on: one pre-Round-4 report, one current report, empty states

## Testing

1. **Geometry diff** — before/after screenshots of each tab: layout identical, only paint differs.
2. **No synthesized bold** — audit computed styles: no `font-weight > 400` on Xanh Mono elements.
3. **Contrast** — spot-check AA (4.5:1) on: body text, ink-soft text, all three signal-type colors as text, badge text on chip backgrounds, bone text on plum buttons.
4. **Triad distinguishability** — Signal Map with all three types visible: identifiable at a glance, including for red-green colorblindness (the chosen triad avoids red/green axis — verify).
5. **Old reports** — render correctly; no dark-theme remnants (watch for hardcoded colors that bypassed tokens — grep for hex values outside the token file).
6. **Emails** — send a test of both templates; render sanely in Gmail (light palette, working plum button).
7. **Screenshot set for Maria** — capture the core tab, Social tab, and landing page for her review.
