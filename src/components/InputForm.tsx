"use client";

import { useState, FormEvent } from "react";

interface InputFormProps {
  onSubmit: (archetype: string, description: string) => void;
  isLoading: boolean;
}

const EXAMPLES = [
  {
    archetype: "New Peloton Subscriber",
    description: "34, motivated by guilt about not working out, lives in suburbs, household income $120k, two kids under 8",
  },
  {
    archetype: "Millennial Wine Enthusiast",
    description: "28-36, drinks natural wine, shops at Trader Joe's and Whole Foods, uses Vivino, follows food content on Instagram",
  },
  {
    archetype: "Crypto-Native Tech Worker",
    description: "25-35, works at a startup or big tech, holds ETH and SOL, reads Bankless, skeptical of institutions",
  },
];

export function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [archetype, setArchetype] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (archetype.trim() && description.trim()) {
      onSubmit(archetype.trim(), description.trim());
    }
  };

  const fillExample = (ex: (typeof EXAMPLES)[0]) => {
    setArchetype(ex.archetype);
    setDescription(ex.description);
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
          Enter an audience archetype. We&apos;ll sweep the web and build a real-time intelligence brief — influence networks, emotional drivers, cultural discourse, and behavioral signals.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-[#1C2333] bg-[#0D1117] p-6">
          <div className="mb-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#6366F1]">
              Archetype Name
            </label>
            <input
              type="text"
              value={archetype}
              onChange={(e) => setArchetype(e.target.value)}
              placeholder="e.g. New Peloton Subscriber"
              disabled={isLoading}
              className="w-full rounded-lg border border-[#1C2333] bg-[#080B0F] px-4 py-3 text-sm text-[#E8EDF2] placeholder-[#374151] outline-none transition-colors focus:border-[#6366F1]/60 disabled:opacity-50"
            />
          </div>
          <div className="mb-6">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#6366F1]">
              Archetype Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the archetype: age, motivations, lifestyle context, income bracket, any emotional signals you already know..."
              disabled={isLoading}
              rows={3}
              className="w-full resize-none rounded-lg border border-[#1C2333] bg-[#080B0F] px-4 py-3 text-sm text-[#E8EDF2] placeholder-[#374151] outline-none transition-colors focus:border-[#6366F1]/60 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !archetype.trim() || !description.trim()}
            className="w-full rounded-lg bg-[#6366F1] py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.3)] transition-all hover:bg-[#818CF8] hover:shadow-[0_0_32px_rgba(99,102,241,0.5)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {isLoading ? "Sweeping Intelligence..." : "Generate Intelligence Report →"}
          </button>
        </div>

        {/* Examples */}
        <div className="mt-5">
          <p className="mb-3 text-center text-xs text-[#6E7681]">Try an example archetype</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.archetype}
                type="button"
                onClick={() => fillExample(ex)}
                disabled={isLoading}
                className="rounded-lg border border-[#1C2333] bg-[#0D1117] px-3 py-2.5 text-left text-xs text-[#8B949E] transition-colors hover:border-[#6366F1]/30 hover:text-[#E8EDF2] disabled:opacity-40"
              >
                <span className="block font-semibold text-[#E8EDF2]">{ex.archetype}</span>
                <span className="mt-0.5 block line-clamp-2 text-[11px] text-[#6E7681]">{ex.description}</span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
