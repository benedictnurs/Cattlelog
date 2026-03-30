import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  ReferenceDot,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Label,
} from "recharts";
import tinycolor from "tinycolor2";
import { CustomTooltip } from "../CustomTooltip";

type Props = {
  data: any[];
  seriesKeys: string[];
  colorMap: Record<string, string>;
  seriesNameMap?: Record<string, string>;
  avgMap?: Record<string, number>;
};

// Custom hook to determine if the screen is mobile-sized
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < breakpoint,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

// Helper function to convert values to numbers, handling nulls and NaNs
const toNum = (v: any) =>
  typeof v === "number" ? v : v == null ? NaN : parseFloat(v);

// Function to compute averages for each series key
function computeAverages(data: any[], keys: string[]) {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const row of data) {
    for (const k of keys) {
      const raw = row[k];
      if (raw == null || raw === "") continue;
      const v = typeof raw === "number" ? raw : parseFloat(raw);
      if (!Number.isFinite(v)) continue;
      sums[k] = (sums[k] ?? 0) + v;
      counts[k] = (counts[k] ?? 0) + 1;
    }
  }
  const avgs: Record<string, number> = {};
  for (const k of keys) avgs[k] = counts[k] ? sums[k] / counts[k] : NaN;
  return avgs;
}

export default function TrendChart({
  data,
  seriesKeys,
  colorMap,
  seriesNameMap,
  avgMap,
}: Props) {
  const isMobile = useIsMobile();

  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [hoveredDotId, setHoveredDotId] = useState<string | null>(null);

  const makeEnter = (id: string) => () => {
    setHoveredDotId(id);
  };

  const handleLeave = () => setHoveredDotId(null);
  // Function to create active dot properties based on hover state
  const activeDotProps = (
    isActive: boolean,
    color: string,
    solidBase = false,
  ) =>
    isActive
      ? { r: 6, fill: tinycolor(color).toHexString(), strokeWidth: 2 }
      : {
          r: 3,
          fill: solidBase ? tinycolor(color).toHexString() : "#fff",
          strokeWidth: 1.5,
        };

  // Normalize data to ensure all series keys are present
  const normalizedData = useMemo(() => {
    const names = Array.from(new Set(data.map((d) => d.name)));
    return names.map((name) => {
      const src = data.find((d) => d.name === name) ?? { name };
      const row: any = { name };
      for (const k of seriesKeys) row[k] = src[k] ?? null;
      if (src.default != null) row.default = src.default;
      return row;
    });
  }, [data, seriesKeys]);

  // Compute single-point keys (keys with only one data point, see the solid circled dots in the chart)
  const singlePointKeys = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of normalizedData) {
      for (const k of seriesKeys) {
        const y = toNum(row[k]);
        if (Number.isFinite(y)) counts[k] = (counts[k] ?? 0) + 1;
      }
    }
    return new Set(
      Object.entries(counts)
        .filter(([, c]) => c === 1)
        .map(([k]) => k),
    );
  }, [normalizedData, seriesKeys]);

  // Compute averages for the series keys
  // If avgMap is provided, use it; otherwise compute averages from normalizedData
  const computedAvgs = useMemo(
    () => computeAverages(normalizedData, seriesKeys),
    [normalizedData, seriesKeys],
  );
  const avgs = avgMap ?? computedAvgs;

  // Check if the default series is present
  const hasDefaultSeries = normalizedData.some((d) => d.default != null);
  const defaultAvg = avgMap?.["default"];

  // Right margin for the chart, adjusted based on mobile view and series presence (see the dotted average lines)
  const rightMargin =
    !isMobile &&
    (seriesKeys.length > 0 || (hasDefaultSeries && Number.isFinite(defaultAvg)))
      ? 60
      : 20;

  return (
    <ResponsiveContainer width="100%" height={361}>
      <LineChart
        data={normalizedData}
        onMouseMove={(e) => setActiveLabel(e?.activeLabel ?? null)}
        onMouseLeave={() => {
          setActiveLabel(null);
          setHoveredDotId(null);
        }}
        margin={{ top: 20, right: rightMargin }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          padding={{ left: 20, right: 20 }}
          tickFormatter={(value: string) => {
            const rx = /^(F|W|S|SU)(\d{4})$/;
            const toShort = (label: string) => {
              const m = label.match(rx);
              return m ? `${m[1]}${m[2].slice(2)}` : label;
            };
            const total = normalizedData.length;
            const SHORT_THRESHOLD = 8;
            const useShort = isMobile || total > SHORT_THRESHOLD;
            return useShort ? toShort(String(value)) : String(value);
          }}
        />
        <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} />
        <Tooltip
          content={<CustomTooltip mode="trend" seriesNameMap={seriesNameMap} />}
        />
        {/* Default series line and average line if available */}
        {hasDefaultSeries && (
          <>
            <Line
              type="monotone"
              dataKey="default"
              stroke={colorMap.default}
              strokeWidth={3}
              strokeOpacity={0.6}
              dot={false}
            />

            {!isMobile && Number.isFinite(defaultAvg) && (
              <ReferenceLine
                y={defaultAvg as number}
                stroke={tinycolor(colorMap.default).lighten(5).toHexString()}
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
              >
                <Label
                  position="right"
                  value={`Avg: ${(defaultAvg as number).toFixed(2)}`}
                  fill={tinycolor(colorMap.default).lighten(5).toHexString()}
                  fontSize={12}
                />
              </ReferenceLine>
            )}
            {normalizedData.map((d, i) => {
              const id = `default-${i}`;
              const isHover = hoveredDotId === id;
              const isXActive = activeLabel != null && d.name === activeLabel;
              const isActive = isHover || isXActive;
              return Number.isFinite(d.default) ? (
                <ReferenceDot
                  key={`def-dot-${i}`}
                  x={d.name}
                  y={d.default}
                  stroke={colorMap.default}
                  onMouseEnter={makeEnter(id)}
                  onMouseLeave={handleLeave}
                  {...activeDotProps(isActive, colorMap.default)}
                  isFront
                />
              ) : null;
            })}
          </>
        )}

        {/* Series lines */}
        {seriesKeys.map((k) => (
          <Line
            key={k}
            type="monotone"
            dataKey={k}
            stroke={tinycolor(colorMap[k]).toHexString()}
            strokeWidth={3}
            strokeOpacity={0.6}
            dot={false}
            connectNulls
          />
        ))}

        {/* Dotted average lines with labels on the right */}
        {!isMobile &&
          seriesKeys.map((k) => {
            const avg = avgMap?.[k] ?? avgs[k];
            if (!Number.isFinite(avg)) return null;
            const color = tinycolor(colorMap[k]).lighten(5).toHexString();
            return (
              <ReferenceLine
                key={`avg-${k}`}
                y={avg}
                stroke={color}
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
              >
                <Label
                  position="right"
                  value={`Avg: ${avg.toFixed(2)}`}
                  fill={color}
                  fontSize={12}
                />
              </ReferenceLine>
            );
          })}
        {/* Dots for each series */}
        {seriesKeys.map((k) =>
          normalizedData.map((d, i) => {
            const y = toNum(d[k]);
            if (!Number.isFinite(y)) return null;
            const id = `${k}-${i}`;
            const color = tinycolor(colorMap[k]).toHexString();
            const isHover = hoveredDotId === id;
            const isXActive = activeLabel != null && d.name === activeLabel;
            const isActive = isHover || isXActive;
            const solidBase = singlePointKeys.has(k);

            return Number.isFinite(y) ? (
              <ReferenceDot
                key={`${k}-dot-${i}`}
                x={d.name}
                y={y}
                stroke={color}
                isFront
                onMouseEnter={makeEnter(id)}
                onMouseLeave={handleLeave}
                {...activeDotProps(isActive, color, solidBase)}
              />
            ) : null;
          }),
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
