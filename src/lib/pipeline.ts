import {
  AgentInputs,
  runAudienceLens,
  runBrandLens,
  runContextLens,
  runReconciliationAgent,
  runSynthesisAgent,
  runPeripheryAgent,
  runEnrichmentAgent,
  runVerifierLLMChecks,
  mergeSocialSignals,
  log,
  AllLensOutputs,
} from "@/lib/agents";
import { runVerifier } from "@/lib/verifier";
import { ArchetypeReport } from "@/types";
import {
  setRunRunning,
  appendProgress,
  completeRun,
  failRun,
  saveReportWithRetry,
} from "@/lib/db";
import { sendCompletionEmail, sendFailureEmail, EMAIL_MIN_DURATION_MS } from "@/lib/email";

/** Short display title derived from the audience description. */
export function deriveTitle(audience: string): string {
  const firstSegment = audience.split(/\s+—\s+|[.\n]/)[0].trim();
  const title = firstSegment || audience.trim();
  return title.length > 64 ? `${title.slice(0, 61).trimEnd()}…` : title;
}

/** First line of the audience description, for the completion email body. */
function oneLiner(audience: string): string {
  return audience.split(/[.\n]/)[0].trim();
}

/**
 * Runs the full agent pipeline and drives a run row to completion or failure.
 * Called un-awaited from the POST /api/analyze handler — Railway runs a
 * persistent Node process, so this keeps executing after the response has
 * already gone out. This pattern relies on a long-lived server process and
 * would silently die on a serverless/edge runtime (the request would end
 * before the pipeline finished).
 */
export async function executeRun(
  runId: string,
  title: string,
  inputs: AgentInputs,
  runBy: string | null
): Promise<void> {
  const startedAt = Date.now();

  const progress = (message: string) => {
    appendProgress(runId, message).catch((err) =>
      console.error(`[sway] progress append failed for run ${runId}:`, err)
    );
  };

  try {
    await setRunRunning(runId);

    const totalAgents = 8;
    let completed = 0;
    function onAgentComplete(name: string) {
      completed++;
      progress(`${name} complete — ${completed}/${totalAgents} agents done`);
    }

    // ── Batch 1: three independent lenses in parallel ──
    progress("Researching audience perspective, brand landscape, and market context — 3 independent lenses...");

    const [audienceLens, brandLens, contextLens] = await Promise.all([
      runAudienceLens(inputs).then((r) => { onAgentComplete("Audience Lens"); return r; }),
      runBrandLens(inputs).then((r) => { onAgentComplete("Brand Lens"); return r; }),
      runContextLens(inputs).then((r) => { onAgentComplete("Context Lens"); return r; }),
    ]);

    const lenses: AllLensOutputs = { audience: audienceLens, brand: brandLens, context: contextLens };

    // ── Batch 2: reconciliation & scoring (with platform data tools) ──
    progress("Reconciling findings across all three lenses & scoring signals...");

    const { reconciliation, toolAudit } = await runReconciliationAgent(inputs, lenses, (message) =>
      progress(message)
    );
    onAgentComplete("Reconciliation & Scoring");

    // ── Batch 3: synthesis, periphery, and enrichment in parallel ──
    // All three depend only on reconciliation. Periphery and Enrichment are
    // non-fatal: a periphery failure ships without the adjacency map; an
    // enrichment failure ships with un-enriched signals (no targetables) and
    // no findability section.
    progress("Synthesizing final report, mapping adjacencies & deriving targetables...");

    const [synthesis, periphery, enrichment] = await Promise.all([
      runSynthesisAgent(inputs, reconciliation).then((r) => { onAgentComplete("Synthesis"); return r; }),
      runPeripheryAgent(inputs, reconciliation)
        .then((r) => { onAgentComplete("Adjacency Mapping"); return r; })
        .catch((err) => {
          console.error("[pipeline] Periphery agent failed, continuing without periphery:", err);
          progress("Adjacency mapping unavailable — finishing report without it");
          return undefined;
        }),
      runEnrichmentAgent(inputs, reconciliation)
        .then((r) => { onAgentComplete("Findability & Enrichment"); return r; })
        .catch((err) => {
          console.error("[pipeline] Enrichment agent failed, continuing un-enriched:", err);
          progress("Enrichment unavailable — finishing report with un-enriched signals");
          return undefined;
        }),
    ]);

    const reportId = crypto.randomUUID();
    const report: ArchetypeReport = {
      ...synthesis,
      archetype: title,
      audience: inputs.audience,
      brand: inputs.brand,
      context: inputs.context,
      generatedAt: new Date().toISOString(),
      peripheryData: periphery,
      dataSignals: reconciliation.dataSignals,
      // Round 8: the merge guard now takes the Enrichment agent's output
      // (was synthesis's). Same authority rule: reconciliation's fields win.
      socialSignals: mergeSocialSignals(reconciliation.socialSignals, enrichment?.enrichedSignals),
      coreSize: reconciliation.coreSize,
      // Findability now comes from the Enrichment agent; synthesis no longer
      // produces it. Absent when enrichment failed — the UI tolerates that.
      findability: enrichment?.findability,
    };

    // ── Final stage: Verifier — non-fatal in BOTH directions ──
    // A crash ships the report without a verifierReport; failed checks ship
    // the report WITH the failures visible. The Verifier informs, never blocks.
    progress("Verifying report integrity...");
    try {
      const verifierReport = await runVerifier(
        { report, reconciliation: { socialSignals: reconciliation.socialSignals }, toolAudit },
        runVerifierLLMChecks
      );
      report.verifierReport = verifierReport;
      for (const c of verifierReport.checks) {
        log(`Verifier check ${c.id}: ${c.status.toUpperCase()} — ${c.detail}`);
      }
      log(`Verifier — ${verifierReport.summary}`);
      onAgentComplete("Verifier");
      progress(`Integrity: ${verifierReport.passCount}/${verifierReport.totalCount} checks passed`);
    } catch (err) {
      log(`Verifier crashed (non-fatal) — shipping report without verifierReport: ${err instanceof Error ? err.message : String(err)}`);
      progress("Integrity check unavailable — shipping report without it");
    }

    try {
      await saveReportWithRetry(reportId, title, inputs.audience, inputs.brand, inputs.context, runBy, report);
    } catch {
      // Belt and suspenders: the report exists, it just didn't make it into
      // Postgres after 3 tries — log the full JSON so it's not truly lost.
      log(`REPORT WRITE FAILED after 3 attempts, run ${runId}. Full report JSON follows for manual recovery:`);
      log(JSON.stringify(report));
      throw new Error("report generated but could not be saved to the database — it has been logged for manual recovery");
    }

    await completeRun(runId, reportId);

    const durationMs = Date.now() - startedAt;
    if (durationMs > EMAIL_MIN_DURATION_MS) {
      sendCompletionEmail(runBy, reportId, title, oneLiner(inputs.audience)).catch((err) =>
        log(`Completion email threw unexpectedly: ${err}`)
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log(`RUN FAILED (${runId}): ${message}${err instanceof Error && err.stack ? ` | ${err.stack.split("\n")[1]?.trim()}` : ""}`);

    await failRun(runId, message).catch((dbErr) =>
      console.error(`[sway] failed to mark run ${runId} as failed:`, dbErr)
    );

    const durationMs = Date.now() - startedAt;
    if (durationMs > EMAIL_MIN_DURATION_MS) {
      sendFailureEmail(runBy, message).catch((emailErr) =>
        log(`Failure email threw unexpectedly: ${emailErr}`)
      );
    }
  }
}
