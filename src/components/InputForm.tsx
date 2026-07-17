"use client";

import { useState, FormEvent } from "react";

interface InputFormProps {
  onSubmit: (audience: string, brand: string, context: string) => void;
  isLoading: boolean;
}

const EXAMPLES = [
  {
    label: "New Peloton Subscribers",
    audience:
      "New Peloton subscribers — 30-something professionals who bought the bike during a guilt-motivated fitness restart, ride 2-3x a week but worry they're not 'Peloton people', and use the leaderboard as motivation but feel intimidated by the top riders.",
    brand:
      "Peloton — connected fitness platform, premium positioning, strong cult following but facing subscriber growth challenges post-pandemic.",
    context:
      "Post-hype phase — the cultural narrative has shifted from 'Peloton is everything' to 'is Peloton still worth it?' and competitors like Apple Fitness+ and free YouTube workouts are pulling casual users.",
  },
  {
    label: "Millennial Natural Wine Enthusiasts",
    audience:
      "Millennial natural wine enthusiasts — 28-36, drinks natural wine, shops at Trader Joe's and Whole Foods, uses Vivino, follows food content on Instagram, cares about provenance and process but doesn't want to be seen as a snob.",
    brand: "",
    context:
      "The natural wine bubble may be peaking — mainstream grocery stores are stocking 'natural' labels, which threatens the insider credibility that drove the movement.",
  },
  {
    label: "Home Crafters",
    audience:
      "Home crafters — people who love to dabble in crafting without wanting to overcommit, consider it an outlet for creativity but don't want to make it their identity or a side hustle.",
    brand: "",
    context: "",
  },
];

const FIELD_CLASSES =
  "w-full resize-none rounded-lg border border-[#1C2333] bg-[#080B0F] px-4 py-3 text-sm text-[#E8EDF2] placeholder-[#374151] outline-none transition-colors focus:border-[#6366F1]/60 disabled:opacity-50";

export function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [audience, setAudience] = useState("");
  const [brand, setBrand] = useState("");
  const [context, setContext] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (audience.trim()) {
      onSubmit(audience.trim(), brand.trim(), context.trim());
    }
  };

  const fillExample = (ex: (typeof EXAMPLES)[0]) => {
    setAudience(ex.audience);
    setBrand(ex.brand);
    setContext(ex.context);
  };

  return (
    <div className="animate-fade-in-up">
      {/* Hero */}
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1C2333] bg-[#0D1117] px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1] animate-pulse-glow" />
          <span className="text-xs font-medium tracking-widest text-[#6366F1] uppercase">
            Influence Intelligence Engine
          </span>
        </div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-[#E8EDF2] sm:text-5xl">
          Project Sway
        </h1>
        <p className="mx-auto max-w-xl text-base text-[#8B949E]">
          Describe an audience. Three independent research lenses sweep the web — audience, brand, and market context — then reconcile into a scored influence report.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-[#1C2333] bg-[#0D1117] p-6">
          <div className="mb-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#6366F1]">
              Audience
            </label>
            <textarea
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Describe the audience psychographically — not demographics like 'women 25-40', but how they think, what they care about, and how they behave. e.g., 'Working moms who are desperate to find some time for themselves — they discover products through other moms on social media and buy things that feel like small acts of rebellion against the never-ending to-do list.'"
              disabled={isLoading}
              rows={4}
              className={FIELD_CLASSES}
            />
          </div>
          <div className="mb-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
              Brand <span className="ml-1 font-normal normal-case tracking-normal text-[#6E7681]">(optional)</span>
            </label>
            <textarea
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Optional — the brand in this equation. Name, category, positioning, and any relevant context. e.g., 'Ritual — DTC vitamins, positioned around transparency and clean ingredients, strong with wellness-forward millennials but looking to expand beyond the already-converted.'"
              disabled={isLoading}
              rows={3}
              className={FIELD_CLASSES}
            />
          </div>
          <div className="mb-6">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#8B949E]">
              Context <span className="ml-1 font-normal normal-case tracking-normal text-[#6E7681]">(optional)</span>
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Optional — why is this research happening now? A market shift, a new product launch, a strategy pivot? e.g., 'We're launching a men's line in Q1 and need to understand how influence works in men's wellness.'"
              disabled={isLoading}
              rows={3}
              className={FIELD_CLASSES}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !audience.trim()}
            className="w-full rounded-lg bg-[#6366F1] py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.3)] transition-all hover:bg-[#818CF8] hover:shadow-[0_0_32px_rgba(99,102,241,0.5)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {isLoading ? "Sweeping Intelligence..." : "Generate Influence Report →"}
          </button>
        </div>

        {/* Examples */}
        <div className="mt-5">
          <p className="mb-3 text-center text-xs text-[#6E7681]">Try an example</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => fillExample(ex)}
                disabled={isLoading}
                className="rounded-lg border border-[#1C2333] bg-[#0D1117] px-3 py-2.5 text-left text-xs text-[#8B949E] transition-colors hover:border-[#6366F1]/30 hover:text-[#E8EDF2] disabled:opacity-40"
              >
                <span className="block font-semibold text-[#E8EDF2]">{ex.label}</span>
                <span className="mt-0.5 block line-clamp-2 text-[11px] text-[#6E7681]">{ex.audience}</span>
                <span className="mt-1 block text-[10px] text-[#374151]">
                  {[ex.brand && "brand", ex.context && "context"].filter(Boolean).join(" + ") || "audience only"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
