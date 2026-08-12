import fs from "fs";
import path from "path";

// Agent-log tail for debugging hosted runs. Auth-protected by the session
// middleware (everything except /login and /api/auth requires the cookie).
// Note: on Railway the log lives in the container's ephemeral filesystem —
// it covers everything since the last deploy/restart, which is exactly the
// window that matters when a run fails.

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lines = Math.min(Math.max(Number(url.searchParams.get("lines") ?? 300), 1), 2000);

  const logPath = path.join(process.cwd(), "agent.log");
  let content = "";
  try {
    content = fs.readFileSync(logPath, "utf-8");
  } catch {
    return new Response("No agent.log yet — no runs since this deployment started.", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const tail = content.split("\n").filter(Boolean).slice(-lines).join("\n");
  return new Response(tail, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
