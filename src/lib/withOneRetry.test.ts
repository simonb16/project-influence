import { describe, expect, it, vi } from "vitest";
import { withOneRetry } from "./pipeline";

// Round 10 Rider A: enrichment gets one retry before the pipeline accepts the
// degraded (un-enriched) run.

describe("withOneRetry", () => {
  it("does not retry on first-try success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const onRetry = vi.fn();
    await expect(withOneRetry(fn, onRetry)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("retries once after a failure and returns the retry's result", async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValue("recovered");
    const onRetry = vi.fn();
    await expect(withOneRetry(fn, onRetry)).resolves.toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("propagates the second failure (graceful degradation takes over)", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("boom"));
    await expect(withOneRetry(fn, vi.fn())).rejects.toThrow("boom");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
