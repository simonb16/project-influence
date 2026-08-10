"use client";

export interface ReportTab<T extends string> {
  id: T;
  label: string;
  sub: string;
  /** Visually dimmed tab (Graveyard). */
  muted?: boolean;
}

interface TabBarProps<T extends string> {
  tabs: Array<ReportTab<T>>;
  activeTab: T;
  onChange: (id: T) => void;
}

export function TabBar<T extends string>({ tabs, activeTab, onChange }: TabBarProps<T>) {
  return (
    <div className="sticky top-[57px] z-20 -mx-4 mb-6 border-b border-[#1C2333] bg-[#080B0F]/95 px-4 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <nav className="flex overflow-x-auto" aria-label="Report sections">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              title={tab.sub}
              className={[
                "relative shrink-0 whitespace-nowrap px-3.5 py-2.5 text-left transition-colors focus:outline-none",
                isActive
                  ? "text-[#E8EDF2]"
                  : tab.muted
                    ? "text-[#3D444D] hover:text-[#6E7681]"
                    : "text-[#6E7681] hover:text-[#8B949E]",
              ].join(" ")}
            >
              <span className="block text-sm font-medium">{tab.label}</span>
              {/* Subtitles are long — show only on the active tab; hover shows via title attr */}
              <span
                className={[
                  "block max-w-[280px] truncate text-[10px]",
                  isActive ? "text-[#6366F1]" : "hidden",
                ].join(" ")}
              >
                {tab.sub}
              </span>
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-t-sm bg-[#6366F1]" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
