import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InfoTileProps {
  title: string; // Total units
  value: number | string; // 12
  color: string; // green-500
}

export default function InfoTile({ title, value, color }: InfoTileProps) {
  const renderTooltipContent = (title: string) => {
    switch (title) {
      case 'Total units':
        return (
          <>
            <p>Green: Normal workload (≤15 units)</p>
            <p>Yellow: Manageable workload (16-20 units)</p>
            <p>Red: Heavy workload (≥21 units)</p>
          </>
        );
      case 'Avg rating':
        return (
          <>
            <p>Green: Excellent rating (≥4.0)</p>
            <p>Yellow: Decent rating (3.0-3.9)</p>
            <p>Red: Poor rating (≤2.9)</p>
          </>
        );
      case 'Weekly workload':
        return (
          <>
            <p>Green: Normal workload ({'<'}50 hrs)</p>
            <p>Yellow: Manageable workload (50-59 hrs)</p>
            <p>Red: Heavy workload (≥60 hrs)</p>
          </>
        );
    }
  };
  return (
    <div className="text-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-muted-foreground underline decoration-dashed decoration-muted-foreground underline-offset-2 cursor-help">
            {title}
          </div>
        </TooltipTrigger>
        <TooltipContent>{renderTooltipContent(title)}</TooltipContent>
      </Tooltip>
      <div
        className={`font-medium text-white ${color} px-2 py-1 rounded inline-block mx-auto mt-1`}
      >
        {value}
      </div>
    </div>
  );
}
