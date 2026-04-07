export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function scoreColor(score: number): string {
  if (score >= 75) return "#EF4444"; // red - high intensity
  if (score >= 50) return "#F59E0B"; // amber - medium
  if (score >= 25) return "#6366F1"; // indigo - moderate
  return "#374151"; // gray - low
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Low";
  return "Trace";
}

export function platformIcon(category: string): string {
  const icons: Record<string, string> = {
    forum: "◈",
    video: "▶",
    audio: "◎",
    social: "◆",
    newsletter: "◉",
    messaging: "◇",
  };
  return icons[category] ?? "○";
}

export function emotionEmoji(emotion: string): string {
  const map: Record<string, string> = {
    guilt: "⬡",
    envy: "◈",
    pride: "◆",
    fomo: "◉",
    belonging: "○",
    competition: "△",
    fear: "▼",
    disgust: "✕",
    reward: "◎",
    scarcity: "◇",
  };
  return map[emotion] ?? "○";
}
