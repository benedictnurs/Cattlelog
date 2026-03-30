import cattlelog_for_chrome from '@public/cattlelog-for-chrome.png';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <div className="flex items-center justify-between gap-3 p-4 bg-primary">
      <a
        href="https://daviscattlelog.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={cattlelog_for_chrome}
          alt="Cattlelog for Chrome"
          className="w-32 h-12 object-contain"
        />
      </a>
      <Button variant="outline" size="sm" asChild>
        <a
          href="https://my.ucdavis.edu/schedulebuilder/index.cfm"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-warning text-white border-warning hover:bg-warning/90"
        >
          Schedule Builder
        </a>
      </Button>
    </div>
  );
}
