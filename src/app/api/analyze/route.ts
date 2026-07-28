import {
  AgentInputs,
  runAudienceLens,
  runBrandLens,
  runContextLens,
  runReconciliationAgent,
  runSynthesisAgent,
  runPeripheryAgent,
  AllLensOutputs,
} from "@/lib/agents";
import { ArchetypeReport } from "@/types";

export const maxDuration = 300;

function encode(obj: object): string {
  return JSON.stringify(obj) + "\n";
}

/** Short display title derived from the audience description. */
function deriveTitle(audience: string): string {
  const firstSegment = audience.split(/\s+—\s+|[.\n]/)[0].trim();
  const title = firstSegment || audience.trim();
  return title.length > 64 ? `${title.slice(0, 61).trimEnd()}…` : title;
}

export async function POST(request: Request) {
  const body = await request.json();
  const audience: string | undefined = body.audience;
  const brand: string | undefined = body.brand || undefined;
  const context: string | undefined = body.context || undefined;

  if (!audience?.trim()) {
    return new Response(JSON.stringify({ error: "Missing audience description" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const inputs: AgentInputs = { audience: audience.trim(), brand, context };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: object) => {
        controller.enqueue(encoder.encode(encode(chunk)));
      };

      // Heartbeat every 5s to prevent Railway/proxy from closing idle stream
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(JSON.stringify({ type: "heartbeat" }) + "\n"));
      }, 5000);

      try {
        const totalAgents = 6;
        let completed = 0;

        function onAgentComplete(name: string) {
          completed++;
          send({
            type: "progress",
            message: `${name} complete — ${completed}/${totalAgents} agents done`,
          });
        }

        // ── Batch 1: three independent lenses in parallel ──
        send({
          type: "progress",
          message:
            "Researching audience perspective, brand landscape, and market context — 3 independent lenses...",
        });

        const [audienceLens, brandLens, contextLens] = await Promise.all([
          runAudienceLens(inputs).then((r) => { onAgentComplete("Audience Lens"); return r; }),
          runBrandLens(inputs).then((r) => { onAgentComplete("Brand Lens"); return r; }),
          runContextLens(inputs).then((r) => { onAgentComplete("Context Lens"); return r; }),
        ]);

        const lenses: AllLensOutputs = { audience: audienceLens, brand: brandLens, context: contextLens };

        // ── Batch 2: reconciliation & scoring ──
        send({ type: "progress", message: "Reconciling findings across all three lenses & scoring signals..." });

        const reconciliation = await runReconciliationAgent(inputs, lenses);
        onAgentComplete("Reconciliation & Scoring");

        // ── Batches 3 + 4: synthesis and periphery in parallel ──
        // Both depend only on reconciliation. Periphery is non-fatal: if it
        // fails even after retry, ship the report without it.
        send({ type: "progress", message: "Synthesizing final report & mapping adjacencies..." });

        const [synthesis, periphery] = await Promise.all([
          runSynthesisAgent(inputs, reconciliation).then((r) => { onAgentComplete("Synthesis"); return r; }),
          runPeripheryAgent(inputs, reconciliation)
            .then((r) => { onAgentComplete("Adjacency Mapping"); return r; })
            .catch((err) => {
              console.error("[analyze] Periphery agent failed, continuing without periphery:", err);
              send({ type: "progress", message: "Adjacency mapping unavailable — finishing report without it" });
              return undefined;
            }),
        ]);

        const report: ArchetypeReport = {
          ...synthesis,
          archetype: deriveTitle(inputs.audience),
          audience: inputs.audience,
          brand: inputs.brand,
          context: inputs.context,
          generatedAt: new Date().toISOString(),
          peripheryData: periphery,
        };

        send({ type: "report", report });
      } catch (err) {
        console.error("[analyze] Error:", err);
        send({
          type: "error",
          error: err instanceof Error ? err.message : "Unknown error occurred",
        });
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // disable buffering on Railway/nginx
    },
  });
}
