import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Course } from '@/popup/App';
import { generateICS, downloadICS } from '@/lib/icsUtils';

interface ExportButtonProps {
  courses: Course[];
  academicTerm: string | null;
}

export default function ExportButton({
  courses,
  academicTerm,
}: ExportButtonProps) {
  const handleExport = () => {
    const icsContent = generateICS(courses, academicTerm);
    downloadICS(icsContent, `${academicTerm}_schedule.ics`);
  };

  return (
    <div className="bg-background mt-4">
      <Button
        onClick={handleExport}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-subheading"
        size="lg"
      >
        <Calendar className="w-4 h-4 mr-2" />
        Export to Calendar
      </Button>
    </div>
  );
}
