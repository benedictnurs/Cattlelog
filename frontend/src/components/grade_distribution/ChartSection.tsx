import {
  LineChart,
  XAxis,
  YAxis,
  Line,
  Area,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";
import tinycolor from "tinycolor2";
import TrendChart from "./landing_grade_distribution/TrendChart";
import { CustomTooltip } from "./CustomTooltip";

interface ChartSectionProps {
  chartData: any[];
  chartType: "line" | "bar";
  selectedSeries: string[];
  colorMap: { [key: string]: string };
  mode: "landing" | "course" | "trend";
  seriesNameMap?: Record<string, string>;
  avgMap?: Record<string, number>;
}

const ChartSection: React.FC<ChartSectionProps> = (props) => {
  const {
    chartData,
    chartType,
    selectedSeries,
    colorMap,
    mode,
    seriesNameMap,
    avgMap,
  } = props;

  // If the mode is "trend", render the TrendChart component
  if (mode === "trend") {
    return (
      <TrendChart
        data={chartData}
        seriesKeys={selectedSeries}
        colorMap={colorMap}
        seriesNameMap={seriesNameMap}
        avgMap={avgMap}
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={361}>
      {chartType === "line" ? (
        <LineChart data={chartData} margin={{ top: 20, right: 30 }}>
          <XAxis dataKey="name" />
          <YAxis
            domain={[0, "auto"]}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
          />
          <Tooltip
            content={
              <CustomTooltip mode={mode} seriesNameMap={seriesNameMap} />
            }
          />
          <Area
            type="linear"
            dataKey="default"
            stroke={colorMap["default"]}
            strokeWidth={3}
            fill={colorMap["default"]}
          />
          {selectedSeries.length === 0 && (
            <Line
              type="linear"
              dataKey="default"
              stroke={colorMap["default"]}
              strokeWidth={3}
              dot={false}
            />
          )}
          {selectedSeries.map((id) => (
            <Line
              key={id}
              type="linear"
              dataKey={id}
              stroke={tinycolor(colorMap[id]).brighten(20).toHexString()}
              strokeWidth={3}
              dot={false}
            />
          ))}
        </LineChart>
      ) : (
        <BarChart data={chartData} margin={{ top: 20, right: 30 }}>
          <XAxis dataKey="name" />
          <YAxis
            domain={[0, "auto"]}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
          />
          <Tooltip
            content={
              <CustomTooltip mode={mode} seriesNameMap={seriesNameMap} />
            }
          />
          {selectedSeries.length === 0 && (
            <Bar
              dataKey="default"
              fill={colorMap["default"]}
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          )}
          {selectedSeries.map((id) => (
            <Bar
              key={id}
              dataKey={id}
              fill={tinycolor(colorMap[id]).brighten(15).toHexString()}
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          ))}
        </BarChart>
      )}
    </ResponsiveContainer>
  );
};

export default ChartSection;
