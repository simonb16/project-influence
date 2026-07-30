import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

/** How trust moves from voice to voice before it reaches a brand claim.
 * Moved from Tab 1 (inside Influence Susceptibility) to the Trust tab. */
export function TrustTransferPaths({ paths }: { paths?: string[] }) {
  if (!paths || paths.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <span className="text-lg">⇀</span>
        <CardTitle>Trust Transfer Paths</CardTitle>
      </CardHeader>
      <p className="mb-3 text-xs text-[#6E7681]">
        How trust moves through this audience — which endorsements carry, and in what order.
      </p>
      <ul className="space-y-2">
        {paths.map((path, i) => (
          <li key={i} className="rounded-lg border border-[#1C2333] bg-[#080B0F] px-3 py-2.5 font-mono text-xs text-[#8B949E]">
            {path}
          </li>
        ))}
      </ul>
    </Card>
  );
}
