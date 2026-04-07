import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "initiator" | "amplifier" | "surface" | "structural" | "default";
  className?: string;
}

const variants = {
  initiator: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  amplifier: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  surface: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  structural: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  default: "bg-[#1C2333] text-[#8B949E] border-[#1C2333]",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
