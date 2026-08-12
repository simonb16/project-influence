import fs from "fs";
import path from "path";

// Recovery endpoint: the most recent completed report, persisted server-side
// by the analyze route before streaming it. Exists so a dropped stream (proxy
// hiccup, closed tab) doesn't waste a 20-minute run — the client's "Recover
// last run" action fetches it from here. Auth-protected by the session
// middleware. Ephemeral like agent.log: survives within a deployment.

export async function GET() {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "last-report.json"), "utf-8");
    return new Response(raw, {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "No completed report available on this deployment yet." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
}
