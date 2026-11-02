import { ReactNode } from "react";

// Round 11A: shared building blocks for the briefing view, mirroring the
// approved mockup's visual language (sway-mockup-A-briefing.html). All light
// theme — tokens live in globals.css under .briefing-root.

/** Punchlist 6: "absorbs:" lines are internal mapping provenance, not reader
 * content. Visible only with ?dev in the URL or NEXT_PUBLIC_DEV_ANNOTATIONS=1.
 * (The briefing only renders client-side after the report fetch, so reading
 * window here is safe.) */
function devAnnotationsEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_DEV_ANNOTATIONS === "1") return true;
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).has("dev");
}

export function ChapterHeader({
  num,
  title,
  tagline,
  useIt,
  absorbs,
}: {
  num: string;
  title: string;
  tagline: string;
  useIt: ReactNode;
  absorbs?: string;
}) {
  return (
    <div>
      <div className="b-kicker" style={{ marginBottom: 10 }}>Chapter {num}</div>
      <h1 className="serif" style={{ fontWeight: 500, fontSize: 34, marginBottom: 4, lineHeight: 1.1 }}>
        {title}
      </h1>
      <p className="serif" style={{ fontStyle: "italic", fontSize: 18, color: "var(--b-ink2)", marginBottom: 14 }}>
        {tagline}
      </p>
      {absorbs && devAnnotationsEnabled() && (
        <p className="mono" style={{ fontSize: 11.5, color: "var(--b-ink3)", margin: "-6px 0 18px" }}>
          absorbs: {absorbs}
        </p>
      )}
      <p style={{ fontSize: 14.5, color: "var(--b-ink2)", marginBottom: 30 }}>
        <em className="serif" style={{ fontStyle: "italic" }}>Use this chapter to</em> {useIt}
      </p>
    </div>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="b-card">
      {title && <h5>{title}</h5>}
      {children}
    </div>
  );
}

export function Cols2({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{children}</div>;
}

export function Chip({ core, children }: { core?: boolean; children: ReactNode }) {
  return <span className={`b-chip${core ? " core" : ""}`}>{children}</span>;
}

/** Featured item — the two-class hierarchy's upper class. */
export function Featured({
  eyebrow,
  title,
  why,
  children,
}: {
  eyebrow: string;
  title: string;
  why?: string;
  children?: ReactNode;
}) {
  return (
    <div className="b-featured">
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "var(--b-accent)", textTransform: "uppercase", marginBottom: 8 }}>
        {eyebrow}
      </div>
      <h3 className="serif" style={{ fontWeight: 500, fontSize: 24, lineHeight: 1.2, marginBottom: 8 }}>{title}</h3>
      {why && (
        <div className="serif" style={{ fontStyle: "italic", fontSize: 16.5, color: "var(--b-ink2)", lineHeight: 1.5, marginBottom: 10 }}>
          {why}
        </div>
      )}
      {children}
    </div>
  );
}

export function FeaturedStrip({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 12, color: "var(--b-ink3)", flexWrap: "wrap" }}>
      {items.map((it, i) => (
        <span key={i}>
          {it.label} <b style={{ color: "var(--b-ink2)" }}>{it.value}</b>
        </span>
      ))}
    </div>
  );
}

/** Evidence disclosure — provenance collapsed by default, present everywhere. */
export function EvidenceDisclosure({
  summary = "Show evidence",
  srcLine,
  children,
}: {
  summary?: string;
  srcLine?: string;
  children: ReactNode;
}) {
  return (
    <details className="b-evd" style={{ marginTop: 12 }}>
      <summary>{summary}</summary>
      <div
        style={{
          marginTop: 10,
          background: "var(--b-bg)",
          borderRadius: 8,
          padding: "12px 14px",
          fontSize: 12.5,
          color: "var(--b-ink2)",
          lineHeight: 1.5,
        }}
      >
        {children}
        {srcLine && (
          <div className="mono" style={{ fontSize: 10.5, color: "var(--b-ink3)", marginTop: 8 }}>
            {srcLine}
          </div>
        )}
      </div>
    </details>
  );
}

/** Collapsed row — the two-class hierarchy's lower class. */
export function Row({
  title,
  line,
  strength,
  children,
}: {
  title: string;
  line: string;
  strength?: string;
  children?: ReactNode;
}) {
  return (
    <details className="b-row">
      <summary>
        <span style={{ fontWeight: 600, fontSize: 14.5, flexShrink: 0 }}>{title}</span>
        <span
          style={{
            color: "var(--b-ink3)",
            fontSize: 13.5,
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {line}
        </span>
        {strength && <span style={{ fontSize: 12, color: "var(--b-ink2)", flexShrink: 0 }}>{strength}</span>}
      </summary>
      <div style={{ padding: "2px 4px 18px", maxWidth: 620, fontSize: 14, color: "var(--b-ink2)", lineHeight: 1.55 }}>
        {children}
      </div>
    </details>
  );
}

export function RowGroup({ head, children }: { head: string; children: ReactNode }) {
  return (
    <div style={{ marginTop: 26 }}>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", color: "var(--b-ink3)", textTransform: "uppercase", marginBottom: 8 }}>
        {head}
      </div>
      {children}
    </div>
  );
}

export function BlockHead({ num, title, link, onNavigate }: { num: string; title: string; link?: string; onNavigate?: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        marginBottom: 12,
        borderBottom: "1px solid var(--b-line)",
        paddingBottom: 7,
      }}
    >
      <span className="mono" style={{ color: "var(--b-ink3)", fontSize: 11 }}>{num}</span>
      <span style={{ fontWeight: 700, fontSize: 13.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>{title}</span>
      {link && onNavigate && (
        <button
          onClick={onNavigate}
          style={{ marginLeft: "auto", fontSize: 12, color: "var(--b-accent)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
        >
          {link}
        </button>
      )}
    </div>
  );
}

export function StatBox({
  n,
  label,
  basis,
  core,
  empty,
}: {
  n: string;
  label: string;
  basis: string;
  core?: boolean;
  empty?: boolean;
}) {
  return (
    <div
      className="b-card"
      style={{
        padding: "10px 16px",
        textAlign: "center",
        borderStyle: empty ? "dashed" : "solid",
      }}
    >
      <div className="mono" style={{ fontSize: 17, fontWeight: 500, color: empty ? "var(--b-ink3)" : core ? "var(--b-accent)" : "var(--b-ink)" }}>
        {n}
      </div>
      <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--b-ink3)", textTransform: "uppercase", marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: 9.5, color: "var(--b-ink3)", marginTop: 2, fontStyle: "italic" }}>{basis}</div>
    </div>
  );
}

/** Muted note line — graceful-degradation / thin-layer messaging. */
export function MutedNote({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: 12.5, color: "var(--b-ink3)", fontStyle: "italic", margin: "14px 0" }}>{children}</p>;
}

/** Wrapper for retired/legacy dark components rendered inside the light shell:
 * contents unchanged, shown on their own dark canvas. */
export function DarkCanvas({ children }: { children: ReactNode }) {
  return (
    <div
      style={{ background: "#080B0F", borderRadius: 12, padding: 22 }}
      className="font-sans"
    >
      {children}
    </div>
  );
}
