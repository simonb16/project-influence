import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono, EB_Garamond, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

// Round 6a type system: Instrument Sans for all UI text, JetBrains Mono for
// labels, scores, and letterspaced small-caps tags.
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// Round 11A editorial theme (the briefing view): EB Garamond for display/serif
// moments, Hanken Grotesk for UI/body. Legacy views keep Instrument Sans.
const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Project Sway — Influence Intelligence Engine",
  description: "AI-powered audience archetype intelligence for modern go-to-market strategy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${jetbrainsMono.variable} ${ebGaramond.variable} ${hankenGrotesk.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
