import { Star } from 'lucide-react';
import { Course } from '@/popup/App';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-3 h-3 fill-warning text-warning" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative w-3 h-3">
          <Star className="w-3 h-3 text-muted-foreground absolute" />
          <div className="overflow-hidden w-1/2">
            <Star className="w-3 h-3 fill-warning text-warning" />
          </div>
        </div>
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-3 h-3 text-muted-foreground" />
      );
    }

    return stars;
  };

  return (
    <div className="bg-card border border-card-border rounded-lg p-3">
      <div className="space-y-2">
        <div>
          <h3 className="subheading text-foreground text-sm">
            {course.shortTitle}
          </h3>
          <p className="body text-muted-foreground text-xs mt-1">
            {course.fullTitle}
          </p>
        </div>

        <div className="space-y-1 text-xs">
          <div>
            <span className="text-muted-foreground">CRN: </span>
            <span className="text-foreground font-medium">{course.crn}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Units: </span>
            <span className="text-foreground font-medium">{course.units}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Instructor: </span>
            <span className="text-foreground font-medium">
              {course.instructor}
            </span>
          </div>
        </div>

        {course.instructorRating && (
          <div className="flex items-center gap-1">
            {renderStars(course.instructorRating)}
            <span className="text-xs text-muted-foreground ml-1">
              {course.instructorRating}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
