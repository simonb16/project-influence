import {
  runInfluenceAgent,
  runHabitatAgent,
  runDiscourseAgent,
  runEmotionalBehavioralAgent,
  runSusceptibilityAgent,
  runCulturalDepthAgent,
  runSynthesisAgent,
  aggregateResearchDepth,
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

      try {
        send({ type: "progress", message: "Deploying 6 research agents..." });

        let completed = 0;
        const total = 6;

        function onAgentComplete(name: string) {
          completed++;
          send({
            type: "progress",
            message: `${name} complete — ${completed}/${total} agents done`,
          });
        }

        // Fan out all 6 agents in parallel
        const [influence, habitat, discourse, emotionalBehavioral, susceptibility, culturalDepth] =
          await Promise.all([
            runInfluenceAgent(archetype, description).then((r) => { onAgentComplete("Influence Map"); return r; }),
            runHabitatAgent(archetype, description).then((r) => { onAgentComplete("Digital Habitat"); return r; }),
            runDiscourseAgent(archetype, description).then((r) => { onAgentComplete("Cultural Discourse"); return r; }),
            runEmotionalBehavioralAgent(archetype, description).then((r) => { onAgentComplete("Emotional & Behavioral"); return r; }),
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

        const report: ArchetypeReport = {
          archetype,
          summary,
          generatedAt: new Date().toISOString(),
          researchDepth: aggregateResearchDepth(research),
          influenceMap: influence.influenceMap,
          digitalHabitat: habitat.digitalHabitat,
          culturalDiscourse: discourse.culturalDiscourse,
          emotionalDrivers: emotionalBehavioral.emotionalDrivers,
          behavioralSignals: emotionalBehavioral.behavioralSignals,
          influenceSusceptibility: susceptibility.influenceSusceptibility,
          culturalDepthCheck: culturalDepth.culturalDepthCheck,
        };

        send({ type: "report", report });
      } catch (err) {
        console.error("[analyze] Error:", err);
        send({
          type: "error",
          error: err instanceof Error ? err.message : "Unknown error occurred",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
