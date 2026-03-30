import { FC } from "react";
import { TooltipProps } from "recharts";

interface CustomTooltipProps extends TooltipProps<number, string> {
  mode: "landing" | "course" | "trend";
  seriesNameMap?: Record<string, string>;
}

const quarterAbbrevMap: Record<string, string> = {
  Fall: "F",
  Winter: "W",
  Spring: "S",
  Summer: "Su",
};
// Format tooltip label based on the mode, either from the landing page or course page
function formatCourse(rawKey: string): string {
  if (rawKey === "default") return "Overall";

  const parts = rawKey.split(" ");
  const lastWord = parts[parts.length - 1];

  if (lastWord.toLowerCase() === "total") {
    const nameParts = parts.slice(0, -1);
    const lastName = nameParts[nameParts.length - 1] || "";
    const firstInitial = nameParts[0]?.charAt(0) || "";
    return `${lastName}, ${firstInitial}. Overall`;
  }

  const year = parts.pop()!;
  const season = parts.pop()!;
  const abbr = quarterAbbrevMap[season] ?? season.charAt(0);

  const lastName = parts.pop() || "";
  const firstName = parts.shift() || "";
  const initial = firstName.charAt(0);

  return `${lastName}, ${initial}. ${abbr}${year}`;
}

function formatLanding(rawKey: string): string {
  if (rawKey === "default") return "Overall UC Davis";
  const [courseId, ...slugParts] = rawKey.split("-");
  const slug = slugParts.join("-");
  const fullName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const parts = fullName.split(" ");
  const last = parts.pop() || "";
  const first = parts.shift() || "";
  const initial = first.charAt(0);

  return `${courseId.toUpperCase()} – ${last}, ${initial}.`;
}

export const CustomTooltip: FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  mode,
  seriesNameMap,
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white shadow-lg rounded-md overflow-hidden max-w-lg">
      <div className="bg-[#1A5276] text-white px-3 py-1 text-center font-bold">
        {label}
      </div>
      <div className="p-2">
        {payload.map((entry) => {
          const key = String(entry.dataKey);
          const val = Number(entry.value ?? 0);
          const color =
            (entry.stroke as string) || (entry.fill as string) || "#1A5276";

          if (mode !== "trend" && Math.round(val * 100) <= 0) return null;

          const name =
            mode === "trend"
              ? (seriesNameMap?.[key] ?? key)
              : mode === "course"
                ? formatCourse(key)
                : formatLanding(key);

          if (mode !== "trend" && Math.round(val * 100) <= 0) return null;

          return (
            <div
              key={key}
              className="flex justify-between items-center text-sm gap-2 break-words"
              style={{ color }}
            >
              <span className="flex items-center gap-2 truncate">
                <span className="truncate">{name}</span>
              </span>
              <span className="font-semibold">
                {" "}
                {mode === "trend"
                  ? `${val.toFixed(2)} GPA`
                  : `${Math.round(val * 100)}%`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
