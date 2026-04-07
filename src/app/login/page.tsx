"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080B0F] px-6">
      <div className="mb-8 text-center">
        <span className="text-3xl text-[#6366F1]">◈</span>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-[#E8EDF2]">Project Sway</h1>
        <p className="mt-1 text-sm text-[#6E7681]">by Significant</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs rounded-xl border border-[#1C2333] bg-[#0D1117] p-6"
      >
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#6366F1]">
          Access Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          autoFocus
          className="mb-4 w-full rounded-lg border border-[#1C2333] bg-[#080B0F] px-4 py-3 text-sm text-[#E8EDF2] placeholder-[#374151] outline-none transition-colors focus:border-[#6366F1]/60"
        />
        {error && (
          <p className="mb-3 text-xs text-red-400">Incorrect password. Try again.</p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-lg bg-[#6366F1] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#818CF8] disabled:opacity-40"
        >
          {loading ? "Verifying..." : "Enter →"}
        </button>
      </form>
    </div>
  );
}
