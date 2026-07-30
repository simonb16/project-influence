# SWAY Phase 1: UI Reorganization — Signals of Influence
## Claude Code Brief

---

## Build Summary

| | |
|---|---|
| **What changes** | Tab structure, section placement, some section labels |
| **What doesn't change** | Agents, prompts, data structures, pipeline, scoring, localStorage schema |
| **Tabs** | 7 (was 4): The Influential Core · Social · Trust · Behavioral · Motivational · Cultural · Adjacencies |
| **New components** | ReportInputs, ResearchDepthSummary |
| **Renamed sections** | Activation Playbook → "Activation Recommendations", Behavioral Signals → "Behaviors and Triggers", Key Behaviors → "Habitual Behaviors", all "Periphery" → "Adjacency" |
| **Backward compatible** | Yes — old saved reports must render correctly in the new tab layout |

---

## What This Round Does

Reorganize the report UI from 4 tabs into 7 tabs that align with Sway's influence framework: the Influential Core definition at the center, surrounded by four "Signals of Influence" (Social, Trust, Behavioral, Motivational), plus Cultural forces and Adjacencies as outer layers.

This is a **UI-only change**. No agents, prompts, or data structures change. Every section that exists today gets moved to a new tab and (in some cases) renamed. The underlying JSON data is identical — we're just rendering it in a new structure.

### Why

The current 4-tab layout (Influence / Influence Map / Entry Points / Periphery) was organized around internal concepts. The new 7-tab layout is organized around what a strategist actually needs to see: who the influential core is, how they behave socially, what they trust, what they do, what motivates them, what cultural forces shape them, and what's adjacent to them. Each tab answers a distinct strategic question.

---

## The New Tab Structure

### Tab 1: "The Influential Core"
**Subtitle:** "The people within this audience who disproportionately influence what others believe, adopt and share."

This is the overview tab — the executive summary of who these people are and how to reach them.

**Sections (in order):**

1. **Report Inputs** (NEW)
   - Label: "REPORT INPUTS"
   - Display the three input fields exactly as the user entered them:
     - Audience: `{audience text}`
     - Brand: `{brand text}` (omit row if empty)
     - Context: `{context text}` (omit row if empty)
   - Simple styled display, not editable. Pull from the stored report data.

2. **Research Depth Summary** (NEW)
   - A compact line or small panel showing what went into this report:
     - "6 agents · X web searches · analyzed [date]"
   - If tool call data is available in future (from the data pipeline round): "6 agents · X web searches · Y platform lookups · analyzed [date]"
   - Keep this minimal — it's context, not content. One line, muted styling.

3. **Influential Core Description** (MOVED from Influence tab)
   - The narrative description of the influential core that currently appears at the top of the Influence tab.
   - No changes to content or styling.

4. **Influence Susceptibility** (MOVED from Entry Points tab)
   - The section that describes what makes this audience susceptible to influence.
   - No changes to content or styling.

5. **Activation Recommendations** (MOVED + RENAMED from Entry Points tab)
   - Currently called "Activation Playbook" — rename the section header to "Activation Recommendations"
   - No changes to content or styling, just the label.

6. **Approach / Avoid** (MOVED from Influence tab)
   - The two-column panel listing influence items to lean into vs. steer away from.
   - No changes to content or styling.

---

### Tab 2: "Social"
**Subtitle:** "The communities and conversations they participate in"

Everything about where the influential core gathers, talks, and builds community.

**Sections (in order):**

1. **Language Codes** (MOVED from Influence tab)
   - The section showing the distinctive language patterns of the influential core.
   - No changes.

2. **Influence Map** (MOVED from Influence Map tab)
   - The cards showing each influence item with its details.
   - No changes to content or styling.

3. **Digital Habitat** (MOVED from Influence Map tab)
   - The section describing where the influential core lives online.
   - No changes.

4. **Influence Quadrant** (MOVED from Influence tab)
   - The dot-based quadrant visualization.
   - No changes. (The hover-label fix from the data pipeline brief is separate and can be applied independently whenever that round is implemented.)

---

### Tab 3: "Trust"
**Subtitle:** "Where they look for validation"

What earns belief and which voices, evidence, or experiences carry weight.

**Sections (in order):**

1. **Trust Signals** (MOVED from Influence tab)
   - The section listing what the influential core trusts and why.
   - No changes.

---

### Tab 4: "Behavioral"
**Subtitle:** "How they behave"

Observable behaviors, habits, and entry points for reaching the influential core.

**Sections (in order):**

1. **Entry Points** (MOVED from Entry Points tab)
   - The entry point cards with type, rationale, and source links.
   - No changes to content or styling.

2. **Behaviors and Triggers** (MOVED + RENAMED from Influence Map tab)
   - Currently called "Behavioral Signals" — rename the section header to "Behaviors and Triggers"
   - No changes to content, just the label.

3. **Habitual Behaviors** (MOVED + RENAMED from Influence tab)
   - Currently called "Key Behaviors" — rename the section header to "Habitual Behaviors"
   - No changes to content, just the label.

---

### Tab 5: "Motivational"
**Subtitle:** "What motivates them"

The emotional drivers and tensions that explain why the influential core acts.

**Sections (in order):**

1. **Emotional Drivers** (MOVED from Influence Map tab)
   - No changes.

2. **Key Tensions** (MOVED from Influence Map tab)
   - No changes.

---

### Tab 6: "Cultural"
**Subtitle:** "The cultural discourse and forces informing them"

The broader cultural context — macro forces, emerging conversations, and cultural shifts shaping the influential core from the outside.

**Sections (in order):**

1. **Cultural Discourse** (MOVED from current location)
   - If this section currently exists as a standalone rendered component, move it here.
   - If the data exists in the JSON but is not currently rendered as its own section, create a simple component to display it.
   - If the data does not exist in the current output schema, leave this tab with a placeholder message: "Cultural analysis coming in a future update." (This will be addressed in Phase 2.)

2. **Cultural Depth Check** (MOVED from current location)
   - Same logic as above: move if it exists, create if the data exists but isn't rendered, placeholder if the data doesn't exist.

**NOTE FOR IMPLEMENTER:** Check the current report JSON output and the existing components. Search for "cultural" in the codebase to find any existing cultural discourse or depth check sections. The Context Lens agent's output likely feeds these sections. If the data exists but was previously embedded within other sections (e.g., within the Influence Map or as part of the reconciled analysis), extract it into its own display. If there is no discrete cultural data in the output, use placeholders — Phase 2 will add the agentic support for this tab.

---

### Tab 7: "Adjacencies"
**Subtitle:** "Cultural adjacencies and overlaps"

Where the influential core connects to broader cultural spaces and adjacent audiences.

**Sections (in order):**

1. **Everything currently in the Periphery tab**, with the following renames:
   - All instances of "Periphery" in section headers, labels, and descriptive text → "Adjacency" / "Adjacencies"
   - "Periphery Map" → "Adjacency Map"
   - "Periphery Insights" → "Adjacency Insights"
   - The concentric rings visualization stays the same, just relabeled
   - The insights sections (surprising overlaps, bridge opportunities, expansion paths) stay the same

**IMPORTANT:** This is a UI label rename only. Do NOT rename the underlying data fields, TypeScript types, or JSON keys. The data structure still uses `periphery` internally — only the user-facing labels change. This ensures backward compatibility.

---

## Implementation Details

### TabBar changes

Update `TabBar.tsx` (or equivalent) to render 7 tabs instead of 4:

```
Old tabs:
  Influence ("Who Matters?")
  Influence Map ("What Moves Them?")
  Entry Points ("Where to Show Up")
  Periphery ("Who Else Are They?")

New tabs:
  The Influential Core ("The people within this audience who disproportionately influence what others believe, adopt and share.")
  Social ("The communities and conversations they participate in")
  Trust ("Where they look for validation")
  Behavioral ("How they behave")
  Motivational ("What motivates them")
  Cultural ("The cultural discourse and forces informing them")
  Adjacencies ("Cultural adjacencies and overlaps")
```

With 7 tabs, the tab bar may need to be scrollable or wrapped on smaller screens. Use horizontal scrolling with overflow on narrow viewports rather than wrapping to a second line.

The subtitles are long — they should appear below each tab name in smaller/muted text, similar to how the current tab subtitles work. If space is tight, subtitles can be hidden on narrow viewports and shown only on hover or when the tab is active.

### New components to create

**`ReportInputs.tsx`**
- Takes the stored audience, brand, and context strings from the report data
- Renders them in a simple labeled display
- Label: "REPORT INPUTS" (styled as a section header)
- Each input on its own line: "Audience: {text}", "Brand: {text}", "Context: {text}"
- Omit Brand and Context lines if they were empty/not provided
- Style: muted background card or bordered section, consistent with existing section styling

**`ResearchDepthSummary.tsx`**
- Compact one-line display of report metadata
- Content: "6 agents · [total search count] web searches · analyzed [timestamp]"
- If search count data is not available in the stored report data, just show: "6 agents · analyzed [timestamp]"
- Style: small text, muted color, positioned just below Report Inputs or as a subtle bar

### Section moves — mapping reference

This is a complete mapping of where every current section goes. Use this as a checklist.

| Current location | Section | New tab | New name (if renamed) |
|---|---|---|---|
| Influence tab | Influential Core description | Tab 1: The Influential Core | — |
| Influence tab | Key Behaviors | Tab 4: Behavioral | "Habitual Behaviors" |
| Influence tab | Trust Signals | Tab 3: Trust | — |
| Influence tab | Language Codes | Tab 2: Social | — |
| Influence tab | Approach / Avoid | Tab 1: The Influential Core | — |
| Influence tab | Influence Quadrant | Tab 2: Social | — |
| Influence Map tab | Influence Map items | Tab 2: Social | — |
| Influence Map tab | Emotional Drivers | Tab 5: Motivational | — |
| Influence Map tab | Key Tensions | Tab 5: Motivational | — |
| Influence Map tab | Digital Habitat | Tab 2: Social | — |
| Influence Map tab | Behavioral Signals | Tab 4: Behavioral | "Behaviors and Triggers" |
| Entry Points tab | Entry Points | Tab 4: Behavioral | — |
| Entry Points tab | Influence Susceptibility | Tab 1: The Influential Core | — |
| Entry Points tab | Activation Playbook | Tab 1: The Influential Core | "Activation Recommendations" |
| Periphery tab | Periphery Map | Tab 7: Adjacencies | "Adjacency Map" |
| Periphery tab | Periphery Insights | Tab 7: Adjacencies | "Adjacency Insights" |
| — (NEW) | Report Inputs | Tab 1: The Influential Core | — |
| — (NEW) | Research Depth Summary | Tab 1: The Influential Core | — |
| Current location TBD | Cultural Discourse | Tab 6: Cultural | — |
| Current location TBD | Cultural Depth Check | Tab 6: Cultural | — |

### ReportView.tsx changes

The main report layout orchestrator (`ReportView.tsx` or equivalent) currently renders content based on which of the 4 tabs is active. Refactor it to:

1. Accept the active tab as one of 7 values
2. For each tab, render only the sections assigned to that tab (see mapping above)
3. Each section component stays the same — it just renders inside a different tab container
4. Section ordering within each tab follows the order listed above

### Data structure — NO CHANGES

Do not modify:
- `src/types/index.ts` — no type changes
- localStorage schema — no changes to how reports are saved/loaded
- Agent output format — no changes
- Any JSON key names — `periphery` stays `periphery` in the data, only UI labels change

---

## Backward Compatibility

This is critical. Old saved reports must render correctly in the new 7-tab structure.

**How it works:**
- The new UI reads the same JSON fields from localStorage that the old UI read
- Sections that exist in the data render in their new tab positions
- Sections that don't exist in the data (e.g., periphery data on old reports that ran before the Periphery agent existed) simply don't render — no error, no empty placeholder
- The Report Inputs section pulls from the stored audience/brand/context fields, which have always been saved
- The Research Depth Summary pulls from whatever metadata is available (timestamp is always saved)

**Test:** Load every saved report after the UI change. Every section should appear — just in a different tab than before. Nothing should be missing, broken, or duplicated.

---

## What NOT to Change

- **Agents** — no changes to any agent
- **Prompts** — no changes to any prompt
- **Data structures / types** — no changes
- **Pipeline** — no changes
- **Scoring** — no changes
- **localStorage** — no changes to read/write logic
- **Section content or styling** — sections look the same, they're just in different tabs
- **Input form** — no changes

---

## Implementation Order

1. **Update TabBar** — change from 4 tabs to 7 tabs with new names and subtitles. Handle overflow/scrolling for narrow viewports.
2. **Create ReportInputs component** — simple display of stored audience/brand/context.
3. **Create ResearchDepthSummary component** — one-line metadata display.
4. **Refactor ReportView** — reorganize which sections render under which tab. This is the main work — moving section components from their current tab containers to their new ones.
5. **Rename section headers** — update display labels for "Activation Recommendations", "Behaviors and Triggers", "Habitual Behaviors", and all "Periphery" → "Adjacency" UI labels.
6. **Handle Tab 6 (Cultural)** — check if cultural discourse and cultural depth check sections exist as current components or data. Wire them up if they exist; add placeholder if they don't.
7. **Test backward compatibility** — load all saved reports and verify every section appears correctly in the new tab structure.

---

## Testing

1. **New report** — run a fresh report. All 7 tabs should populate with the correct sections. No section should appear on more than one tab. No section should be missing.
2. **Old report** — load a saved report from before this change. All sections should render in their new tab positions. No errors.
3. **Pre-periphery report** — load a report that was saved before the Periphery agent existed. Tab 7 (Adjacencies) should either show nothing or show a subtle "no adjacency data" message. All other tabs should work.
4. **Section renames** — verify:
   - "Activation Playbook" now reads "Activation Recommendations"
   - "Behavioral Signals" now reads "Behaviors and Triggers"
   - "Key Behaviors" now reads "Habitual Behaviors"
   - All "Periphery" labels now read "Adjacency" / "Adjacencies"
5. **Tab navigation** — click through all 7 tabs. Each should render instantly (no loading state — data is already in memory). Active tab indicator should work consistently.
6. **Tab bar on narrow viewport** — verify tabs are accessible on narrow screens (scrollable, not clipped).
7. **Report Inputs** — verify audience, brand, and context display correctly. Verify brand/context rows are omitted when those fields were empty.
8. **Tab 6 (Cultural)** — verify either existing cultural sections render or a placeholder appears gracefully.
9. **No data duplication** — verify no section appears in two tabs simultaneously.
