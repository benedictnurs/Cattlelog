import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CourseCard, {
  TeachingStatus,
} from "../components/favorites_page/CourseCard";
import { Course } from "../components/types/Course";
import posthog from "posthog-js";

const Favorites: React.FC = () => {
  const [favoriteCourses, setFavoriteCourses] = useState<Course[]>([]);
  const [teachingStatus, setTeachingStatus] = useState<TeachingStatus>({});

  useEffect(() => {
    const saved: Course[] = JSON.parse(
      localStorage.getItem("favorites") || "[]",
    );
    setFavoriteCourses(saved);

    const status: TeachingStatus = {};
    saved.forEach((course) => {
      if (!course.professors?.length) return;

      course.professors.forEach((professor) => {
        const key = `${professor.id}-${course.course_id}`;
        status[key] = professor.is_teaching;
      });
    });
    setTeachingStatus(status);
  }, []);

  const toggleFavorite = (courseId: string) => {
    const updated = favoriteCourses.filter((c) => c.course_id !== courseId);
    posthog.capture("favorite_removed", { course_id: courseId });
    localStorage.setItem("favorites", JSON.stringify(updated));
    setFavoriteCourses(updated);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="mx-5 sm:mx-28 my-8 sm:my-16 flex-1 bg-white">
        <h1 className="text-lg sm:text-3xl font-bold sm:mb-4">Favorites</h1>
        <div className="border-b border-slate-200 mb-4" />

        {favoriteCourses.length === 0 ? (
          <p className="text-gray-500">You have no favorite courses yet.</p>
        ) : (
          <div className="grid gap-14 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
            {favoriteCourses.map((course) => (
              <CourseCard
                key={course.course_id}
                course={course}
                teachingStatus={teachingStatus}
                toggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Favorites;
