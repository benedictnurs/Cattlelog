import { Button } from '@/components/ui/button';
import icon512 from '@public/icon512.png';

export default function EmptyPage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <img src={icon512} alt="Cattlelog Cow" className="w-24 h-24 mb-3" />
      <h2 className="text-xl font-semibold mb-3 text-foreground">
        No Classes Selected
      </h2>
      <p className="text-muted-foreground mb-6 max-w-sm">
        You haven't selected any classes yet. Visit Schedule Builder to add
        classes to your schedule.
      </p>
      <Button asChild>
        <a
          href="https://my.ucdavis.edu/schedulebuilder/index.cfm"
          target="_blank"
          rel="noopener noreferrer"
        >
          Go to Schedule Builder
        </a>
      </Button>
    </div>
  );
}
