import { BarChart3, LineChart } from "lucide-react";
import { motion } from "framer-motion";

type View = "distribution" | "trend";

export default function ViewToggle({
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
        className="inline-flex gap-6 border-b border-neutral-200"
      >
        {items.map(({ key, label, Icon }) => {
          const active = view === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => setView(key)}
              className={`relative -mb-[1px] inline-flex items-center gap-2 pb-2 text-sm font-medium
                border-b-2 focus:outline-none rounded-[2px]
                transition-colors duration-150
                ${
                  active
                    ? "border-transparent text-[#1A5276]"
                    : "border-transparent text-neutral-600 hover:text-neutral-900"
                }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>

              {active && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#1A5276] rounded-full"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 36,
                    mass: 0.25,
                  }}
                  initial={false}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
