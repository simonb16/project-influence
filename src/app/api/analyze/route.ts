import {
  runInfluenceAgent,
  runHabitatAgent,
  runDiscourseAgent,
  runEmotionalBehavioralAgent,
  runSusceptibilityAgent,
  runCulturalDepthAgent,
  runSynthesisAgent,
  runPeripheryAgent,
  aggregateResearchDepth,
  aggregateSources,
  AllResearch,
} from "@/lib/agents";
import { ArchetypeReport } from "@/types";

export const maxDuration = 300;

function encode(obj: object): string {
  return JSON.stringify(obj) + "\n";
}

export async function POST(request: Request) {
  const { archetype, description } = await request.json();

  if (!archetype || !description) {
    return new Response(JSON.stringify({ error: "Missing archetype or description" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

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
        send({ type: "progress", message: "Deploying 7 research agents..." });

        let completed = 0;
        const total = 7;

        function onAgentComplete(name: string) {
          completed++;
          send({
            type: "progress",
            message: `${name} complete — ${completed}/${total} agents done`,
          });
        }

        // Run agents in batches of 2 to stay under rate limits
        const [influence, habitat] = await Promise.all([
          runInfluenceAgent(archetype, description).then((r) => { onAgentComplete("Influence Map"); return r; }),
          runHabitatAgent(archetype, description).then((r) => { onAgentComplete("Digital Habitat"); return r; }),
        ]);

        const [discourse, emotionalBehavioral] = await Promise.all([
          runDiscourseAgent(archetype, description).then((r) => { onAgentComplete("Cultural Discourse"); return r; }),
          runEmotionalBehavioralAgent(archetype, description).then((r) => { onAgentComplete("Emotional & Behavioral"); return r; }),
        ]);

        const [susceptibility, culturalDepth] = await Promise.all([
          runSusceptibilityAgent(archetype, description).then((r) => { onAgentComplete("Influence Susceptibility"); return r; }),
          runCulturalDepthAgent(archetype, description).then((r) => { onAgentComplete("Cultural Depth"); return r; }),
        ]);

        const research: AllResearch = {
          influence,
          habitat,
          discourse,
          emotionalBehavioral,
          susceptibility,
          culturalDepth,
        };

        send({ type: "progress", message: "Synthesizing intelligence report..." });

        const summary = await runSynthesisAgent(archetype, description, research);

        send({ type: "progress", message: "Mapping periphery influence territories..." });

        const periphery = await runPeripheryAgent(archetype, description, research, summary)
          .then((r) => { onAgentComplete("Periphery Influence"); return r; });

        const report: ArchetypeReport = {
          archetype,
          query: description,
          summary,
          generatedAt: new Date().toISOString(),
          researchDepth: aggregateResearchDepth(research, periphery),
          influenceMap: influence.influenceMap,
          entryPoints: influence.entryPoints,
          digitalHabitat: habitat.digitalHabitat,
          rankedSources: habitat.rankedSources,
          culturalDiscourse: discourse.culturalDiscourse,
          emotionalDrivers: emotionalBehavioral.emotionalDrivers,
          behavioralSignals: emotionalBehavioral.behavioralSignals,
          influenceSusceptibility: susceptibility.influenceSusceptibility,
          culturalDepthCheck: culturalDepth.culturalDepthCheck,
          sources: aggregateSources(research, periphery),
          periphery: periphery.periphery,
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
