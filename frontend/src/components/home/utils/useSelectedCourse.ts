import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Course } from "../../types/Course";

export function useSelectedCourseFromParams(courses: Course[]) {
  const { courseId } = useParams();
  const [selected, setSelected] = useState<Course | null>(null);

  useEffect(() => {
    if (!courseId || !courses.length) return;

    const match = courses.find(
      (c) => c.course_id.toLowerCase() === courseId.toLowerCase(),
    );

    setSelected(match || null);
  }, [courseId, courses]);

  return [selected, setSelected] as const;
}
