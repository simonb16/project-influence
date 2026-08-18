This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Data tool environment variables (Round 5)

The Reconciliation agent can call platform APIs to validate lens findings.
All keys are optional — a missing key disables that tool (it's never shown to
the agent), and the pipeline runs qualitatively without it. Tools activate
automatically when their keys are added; no code changes needed.

```
# .env.local (local) / Railway service environment (production)
ANTHROPIC_API_KEY=        # required — powers all agents
YOUTUBE_API_KEY=          # YouTube Data API v3 (Google Cloud Console)
SERPAPI_KEY=              # SerpApi — primary Google Trends backend (250 free searches/mo)
REDDIT_CLIENT_ID=         # Reddit script app (reddit.com/prefs/apps)
REDDIT_CLIENT_SECRET=
PINTEREST_ACCESS_TOKEN=   # Pinterest API v5 (business account)
# Google Trends: uses SerpApi when SERPAPI_KEY is set (reliable, ~2 searches
# per Trends lookup); falls back to unofficial endpoints when absent (gets
# bot-blocked after ~10 calls, worse from datacenter IPs). Production Trends
# reliability depends on SERPAPI_KEY being set in Railway.
DISABLE_DATA_TOOLS=       # set to 1 to disable ALL data tools (incl. Trends)
```

## Job model, database, and email (Round 7)

Railway's edge proxy kills any HTTP connection at 15:00, and reports had grown
to take 18–24 minutes. `POST /api/analyze` now returns a `runId` in
milliseconds and fires the pipeline detached (un-awaited — this relies on
Railway running a persistent Node process; it would NOT work on a
serverless/edge platform, where the function tears down as soon as the
response goes out). The client polls `GET /api/runs/:id` every 4s instead of
holding a long-lived stream open. Reports live in Postgres, not localStorage,
so the team sees each other's runs.

### Two Postgres databases

There are two separate Railway Postgres instances on this project:

- **postgres-production** — wired to the app service's `DATABASE_URL` as a
  Railway variable reference. This is what production reads and writes.
- **postgres-dev** — for local development. Its connection string (Railway's
  public proxy host, e.g. `viaduct.proxy.rlwy.net:PORT`) goes in
  `DATABASE_URL` in `.env.local`. It is a separate Railway Postgres instance
  rather than a local install, so dev matches production's Postgres version
  with zero local setup.

Both are plain Postgres — `pg` with hand-written queries, two tables
(`runs`, `reports`), no ORM. Schema is created automatically (`CREATE TABLE
IF NOT EXISTS`) the first time any request touches the database, so there's
no separate migration step to run.

Note: the `runs` table carries `title` and `audience` columns beyond the
brief's original schema sketch — needed so the homepage can show *which*
audience an in-progress or failed run belongs to (important once concurrent
runs from different people are normal), without joining to `reports`.

### Email (Resend)

`RESEND_API_KEY` is set in Railway's variables only — deliberately **not**
in `.env.local`. Local dev has no key, so:

- Emails are skipped silently (logged, not sent, not an error).
- The run status's `emailEnabled` flag is `false`, so the client shows the
  no-email variant of the "you can close this window" notice even if an
  address was entered — because the notice's promise ("we'll email you")
  would be a lie if the server can't actually send.

In production, a completion email goes out when a run finishes **and** an
email was entered **and** the run took longer than 2 minutes (nobody needs
an email for something they watched finish). A failure email goes out under
the same duration/address conditions when a run fails. Email is always
non-fatal — a send failure is logged and never affects the run or report.

The sender address defaults to Resend's `onboarding@resend.dev` test sender
(works without setup, but only reliably for now — see Resend's own docs on
sandbox sending limits). Set `EMAIL_FROM` once a real domain is verified
with Resend. Report links point at `APP_URL` if set, else
`https://${RAILWAY_PUBLIC_DOMAIN}` (Railway sets this automatically for
public services), else `localhost:3000`.

```
# Railway service environment only — omit from .env.local
RESEND_API_KEY=           # Resend API key; absent = emails skip silently (dev)
EMAIL_FROM=                # optional — "Name <verified@yourdomain.com>"
APP_URL=                   # optional — overrides the auto-detected Railway URL in email links
```

### What retired

The SSE streaming delivery (`/api/analyze` used to hold the connection open
and stream progress + the final report) and the disconnect-recovery
workaround it needed (`/api/reports/latest`, `/api/logs`, the "Recover Last
Run" button) are gone — the job model replaces both. A dropped browser tab
no longer matters: the run keeps going server-side regardless, and reopening
the homepage shows it in progress or complete.

## The Verifier (Round 8)

Every run ends with a Verifier stage: nine integrity checks (schema
conformance, reference integrity, evidence traceability, number sourcing,
and more) against the finished report. Results show as a quiet line in the
report footer — "· ✓ N/N integrity checks" — that expands into a per-check
panel on click. It's non-fatal in both directions: a Verifier crash ships
the report with no `verifierReport` at all, and a failed check ships the
report with the failure visible rather than blocking it.

**Team norm: a report whose integrity footer shows any FAIL is not for
external use — re-run it.** Runs are cheap; this norm is absolute, no
judgment calls about whether "this particular FAIL probably doesn't
matter." A FAIL means the Verifier found something it couldn't reconcile —
a number with no source, a signal that drifted, a claim that doesn't trace
back to evidence. WARNs are informational and don't block use on their own;
FAILs do.
