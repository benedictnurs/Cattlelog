import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CoursesFilterProps {
  option: string;
  setOption: (option: string) => void;
}

export default function CoursesFilter({
  option,
  setOption,
}: CoursesFilterProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="subheading text-foreground">Your Classes</h2>
      <Select value={option} onValueChange={setOption}>
        <SelectTrigger className="w-48 bg-background border-border">
          <SelectValue placeholder="Select course type" />
        </SelectTrigger>
        <SelectContent className="bg-background border-border shadow-lg z-50">
          <SelectItem value="all">All classes</SelectItem>
          <SelectItem value="registered">Registered classes</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
