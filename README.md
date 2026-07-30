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
REDDIT_CLIENT_ID=         # Reddit script app (reddit.com/prefs/apps)
REDDIT_CLIENT_SECRET=
PINTEREST_ACCESS_TOKEN=   # Pinterest API v5 (business account)
# Google Trends needs no key (unofficial endpoints — may throttle)
DISABLE_DATA_TOOLS=       # set to 1 to disable ALL data tools (incl. Trends)
```
