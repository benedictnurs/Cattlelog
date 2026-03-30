// POTENTIAL ALTERNATE VIEW TOGGLE COMPONENT
// UNUSED CURRENTLY

import { motion } from "framer-motion";
import { BarChart3, LineChart } from "lucide-react";

type View = "distribution" | "trend";

function ViewToggle2({
  view,
  setView,
}: {
  view: View;
  setView: (v: View) => void;
}) {
  const items = [
    { key: "distribution" as const, label: "Distribution", Icon: BarChart3 },
    { key: "trend" as const, label: "GPA Trend", Icon: LineChart },
  ];

  return (
    <div className="px-4 md:px-12 pb-4">
      <div
        role="tablist"
        aria-label="Chart view"
        className="inline-flex items-center gap-1 rounded-2xl border bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm p-1"
      >
        {items.map(({ key, label, Icon }) => {
          const active = view === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => setView(key)}
              className="relative px-4 py-2 rounded-xl text-sm font-medium
                         flex items-center gap-2 focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-[#1A5276]/50
                         transition-colors"
            >
              {/* animated pill lives inside the active button */}
              {active && (
                <motion.span
                  layoutId="togglePill"
                  className="absolute inset-0 rounded-xl bg-[#1A5276] shadow-sm pointer-events-none"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 34,
                    mass: 0.28,
                  }}
                  initial={false}
                />
              )}

              <Icon
                className={`h-4 w-4 relative z-10 ${active ? "text-white" : "text-[#1A5276]"}`}
              />
              <span
                className={`relative z-10 ${active ? "text-white" : "text-[#1A5276]"}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ViewToggle2;
