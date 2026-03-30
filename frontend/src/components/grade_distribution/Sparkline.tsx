import React from "react";
import { BarChart, Bar } from "recharts";

interface SparklineProps {
  grades: Record<string, number>;
}

export const Sparkline: React.FC<SparklineProps> = ({ grades }) => {
  const data = Object.entries(grades).map(([k, v]) => ({ k, v }));

  return (
    <div className="w-[100px] h-6 flex items-center justify-center shrink-0">
      <BarChart
        width={100}
        height={24}
        data={data}
        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
      >
        <Bar dataKey="v" fill="#1A5276" barSize={6} radius={[2, 2, 0, 0]} />
      </BarChart>
    </div>
  );
};
