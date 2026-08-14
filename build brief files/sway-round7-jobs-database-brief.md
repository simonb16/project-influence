# SWAY Round 7: Job Model + Database + Shared Reports
## Claude Code Brief

*Fixes the Railway 15-minute connection cutoff properly, and uses the same plumbing to move reports server-side so the whole team sees each other's runs. No pipeline changes — this is route, client, and storage only.*

---

## Build Summary

| | |
|---|---|
| **Problem** | Railway's edge proxy kills any HTTP connection at 15:00; runs now take 18-24 min. Pipeline completes server-side but the browser watching it dies. Also: reports live in localStorage, so each person's reports are invisible to everyone else. |
| **Fix** | Kick-off returns a run ID in milliseconds → client polls status → report lands in Postgres → everyone's reports visible to everyone |
| **New infra** | Railway Postgres (DATABASE_URL) · Resend for completion emails (RESEND_API_KEY) |
| **What doesn't change** | The agent pipeline itself — zero prompt/agent/scoring changes. Report content identical. |
| **Retires** | The SSE long-stream delivery · the recover-link workflow |

---

## Part 1: The Job Model

### API shape

```
POST /api/analyze
  → validates input, creates a run row (status: queued), fires the pipeline
    asynchronously, and returns { runId } immediately (< 1s)

GET /api/runs/:id
  → { status: 'queued' | 'running' | 'complete' | 'failed',
      progress: ProgressEvent[],      // the same events SSE used to stream
      reportId?: string,              // set when complete
      error?: string }                // set when failed

GET /api/reports          → list (id, title, inputs summary, createdAt, runBy)
GET /api/reports/:id      → full report JSON
DELETE /api/reports/:id   → delete
```

### Server-side execution

- The pipeline runs detached from the request — kick it off with an un-awaited async call (Railway runs a persistent Node server, so background work survives the response; this would NOT work on serverless, note it in a comment).
- Progress events that used to go over SSE now get **appended to the run row** as they happen (same event objects — reuse them). The progress feed's content is unchanged, only its transport.
- On completion: write the report to the reports table, set the run to `complete` with the reportId.
- On pipeline error: set `failed` with the error message.
- **Orphan handling:** if the server restarts mid-run (redeploy), the in-memory pipeline is gone. On boot, mark any run still in `queued`/`running` as `failed` with error "interrupted by server restart — please re-run". Honest and cheap; do not attempt resume logic.
- **Concurrency:** allow parallel runs (each is its own row). Add a soft guard: max 3 concurrent runs, POST returns 429 with a friendly message beyond that (protects API budgets from colleague pile-ups).

### Client changes

- Submitting the form: POST → get runId → switch to the progress view.
- **The progress view opens with a dismissible notice at the top:** "Reports take around 20 minutes. You can close this window — we'll email {their email} when it's ready." When no email was entered (or the server reports email isn't configured, e.g. local dev — expose a tiny `emailEnabled` flag on the run status), the notice reads instead: "Reports take around 20 minutes. Your report will appear in Previous Reports when complete — you can close this window and come back." The point of this round is that nobody has to babysit a run; the UI should say so explicitly.
- Progress view polls `GET /api/runs/:id` every 4 seconds, rendering the same progress feed UI from the polled events. No visual change to the experience beyond the notice — same messages, same order.
- On `complete`: fetch the report and render it. On `failed`: show the error with a re-run button.
- If the user closes the tab mid-run: the run continues server-side. The homepage shows in-progress runs (status badge) so they can reopen and resume watching — this replaces the recover link with something better.
- **Remove the SSE client code and the recover-link workflow** once the polling path is verified.

---

## Part 2: Postgres

### Setup

- Add the Railway Postgres addon to the project; it provides `DATABASE_URL`. Add the same to `.env.local` for dev — either a local Postgres or (simpler) a second Railway Postgres instance for dev. Document the choice in the README.
- Use a lightweight client — `pg` with hand-written queries or Drizzle if preferable. **No heavyweight ORM.** Two tables; keep it boring.

### Schema

```sql
CREATE TABLE reports (
  id          TEXT PRIMARY KEY,          -- keep the existing report id format
  title       TEXT NOT NULL,             -- derived title as today
  audience    TEXT NOT NULL,
  brand       TEXT,
  context     TEXT,
  run_by      TEXT,                      -- free-text name, see Part 3
  created_at  TIMESTAMPTZ NOT NULL,
  report_json JSONB NOT NULL             -- the entire report object, unchanged shape
);

CREATE TABLE runs (
  id          TEXT PRIMARY KEY,
  status      TEXT NOT NULL,             -- queued | running | complete | failed
  progress    JSONB NOT NULL DEFAULT '[]',
  report_id   TEXT REFERENCES reports(id),
  error       TEXT,
  run_by      TEXT,
  created_at  TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL
);
```

The report JSON blob stays exactly the shape the UI already consumes — the renderer must not need changes. Resist any urge to normalize report internals into columns; JSONB is correct here.

---

## Part 3: Shared Reports (the team win)

- The homepage "Previous Reports" list now reads from `GET /api/reports` — **everyone sees everyone's reports.** This is intentional: it's an internal team tool, colleagues reviewing each other's test runs is the point.
- **Run attribution, no auth:** an **email field** (see Part 4 — it doubles as the notification address) — asked once, stored in the browser's localStorage, sent with each run as `run_by`, shown on the report list ("Home crafters · Aug 12 · maria"). No accounts, no login. If empty, show "—" and skip notifications for that run.
- In-progress runs appear at the top of the list with a live status badge, clickable to watch their progress. **Failed runs are also listed** (dimmed, with their error) and clicking one shows a run-detail view: the full progress event history plus the error — this absorbs what the temporary /api/logs + recovery endpoints did, which then retire along with the recover link.
- Delete: anyone can delete any report (team tool; add a confirm dialog).
- localStorage's role shrinks to: the user's name, and legacy pre-migration reports (Part 4).

---

## Part 4: Email Notifications

The point of the job model is that nobody waits with a window open. Close the loop with email:

- **Identity field:** replace the planned "your name" free-text field with an **email field** — asked once, remembered in localStorage, sent with each run. The email doubles as attribution: the reports list shows the part before the @ (or a display-name field alongside if preferred — keep it one small form either way). No passwords, no accounts, no magic links this round — this is notification identity, not auth.
- **Provider:** Resend (simplest modern choice — `RESEND_API_KEY` env var, a few lines of code). Sender can be their onboarding/dev domain for now; note in the README that a proper from-address needs a domain verification when we care.
- **Completion email:** when a run completes — subject "Your SWAY report is ready: {title}", body with the report title, the audience one-liner, and a direct link to the report (the Railway URL + report route; reports need a direct-linkable route if they don't have one — add `/report/:id`).
- **Failure email:** when a run fails — subject "Your SWAY run hit a problem", the error message, and a link to re-run.
- **Non-fatal:** email failure never affects the run or report — log and move on. If RESEND_API_KEY is absent, skip emails silently (dev environments).
- Small courtesy: only send if the run took longer than 2 minutes (nobody needs an email for something they watched finish).

---

## Part 5: Migration of Existing Reports

One-time import so nobody loses history:

- On first load after this deploys, if localStorage contains reports that aren't on the server (match by id), show a quiet banner: "You have N reports stored locally — import them to the shared library?" with an Import button.
- Import POSTs them to a `POST /api/reports/import` endpoint (id-dedupes server-side, sets run_by to the user's name).
- After successful import, mark them migrated locally (don't delete the local copies this round — belt and suspenders).
- The banner dismisses permanently once localStorage has nothing unimported.

---

## Failure Modes

- **DB unreachable at request time:** POST /api/analyze fails fast with a clear error ("database unavailable") — do NOT fall back to the old SSE path; one delivery mechanism, not two.
- **DB write fails at pipeline completion:** retry the report write 3x with backoff; if still failing, log the full report JSON to the server log as a last-resort recovery artifact and mark the run failed with a message saying the report is recoverable from logs.
- **Poll requests failing intermittently:** client tolerates up to 5 consecutive poll failures (transient network) before showing a warning; the run itself is unaffected.

---

## What NOT to Change

- The agent pipeline, prompts, models, tool-use — nothing.
- The report JSON shape — the renderer works unmodified.
- The report UI — tabs, sections, styling all untouched.
- The input form (other than the one-time name field).

---

## Implementation Order

1. Postgres setup + schema + client (Part 2)
2. Run/report persistence + the job endpoints (Part 1 server side)
3. Client polling path (Part 1 client side) — verified against a real full run
4. Shared reports list + attribution (Part 3)
5. Email notifications (Part 4) — Resend wiring, /report/:id route, completion + failure emails
6. Migration banner + import (Part 5)
7. Remove SSE delivery + recover link
8. Deploy to Railway and validate with a real >15-minute run — including receiving the completion email with a working report link

---

## Testing

1. **The headline test:** a full run on Railway production exceeding 15 minutes — progress polls smoothly the whole way, report appears at completion. No network error, no recover step.
2. **Two browsers** (or you + a colleague): both see the same report list; a run started in one is watchable from the other via its status badge.
3. **Close the tab mid-run** — run completes server-side; reopening shows it in the list, complete.
4. **Redeploy mid-run** — run marked failed with the restart message; no zombie "running" rows.
5. **Concurrency guard** — a 4th simultaneous run gets the friendly 429.
6. **Migration** — a browser with old localStorage reports sees the banner, imports, reports appear server-side with attribution; second visit shows no banner.
7. **Old reports render** — imported pre-Round-7 reports open correctly through the server path (the JSON shape never changed, so this should be free — verify anyway).
8. **DB-down failure modes** — kill DATABASE_URL locally: analyze fails fast and clearly; no silent SSE fallback.
9. **Email** — production run completion sends the email to the address entered, with a /report/:id link that opens the right report; a forced failure sends the failure email; local dev (no RESEND_API_KEY) sends nothing and logs the skip; runs under 2 minutes send nothing.
10. **The close-this-window notice** — shows the email variant on production (with the actual address), the no-email variant locally; dismissible; actually true (closing the window and returning after completion shows the finished report in the list).
