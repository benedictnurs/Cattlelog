import { useState, useEffect } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import Header from '@/components/header/Header';
import LoadingPage from '@/components/LoadingPage';
import EmptyPage from '@/components/EmptyPage';
import CoursesFilter from '@/components/courses/CoursesFilter';
import CourseCard from '@/components/courses/CourseCard';
import WorkloadOverview from '@/components/workload/WorkloadOverview';
import ExportButton from '@/components/ExportButton';

export interface Course {
  shortTitle: string; // ECS 120
  fullTitle: string; // Theory of Computation
  status: string; // Registered, Waitlist, etc.
  crn: string; // 29024
  units: string; // 4
  instructor: string; // C. Aramian
  instructorRating: number | null | undefined; // 4.5
  description: string; // Intro to Computer Science...
  finalExamDate: string; // 12/8/2025 3:30 PM
  courseDropDate: string; // 10/7/2025 (10 Day Drop)
  meetings: Meeting[];
}

export interface Meeting {
  type: string; // Lecture, Lab, etc.
  time: string; // 10:00 AM - 11:00 AM
  days: string; // MWF
  location: string; // Wellman Hall 1000
}

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [schedule, setSchedule] = useState<Course[]>([]);
  const [academicTerm, setAcademicTerm] = useState<string | null>(null);
  const [filteredSchedule, setFilteredSchedule] = useState<Course[]>([]);
  const [filterOption, setFilterOption] = useState('registered'); // or "all"

  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'getSchedule' }, (response) => {
      setSchedule(response.schedule);
      setAcademicTerm(response.academicTerm);
      setIsLoading(false);
    });
    chrome.runtime.sendMessage({ action: 'getFilterOption' }, (response) =>
      setFilterOption(response)
    );
  }, []);

  useEffect(() => {
    chrome.runtime.sendMessage({
      action: 'saveFilterOption',
      filterOption: filterOption,
    });
  }, [filterOption]);

  useEffect(() => {
    if (filterOption === 'all') {
      setFilteredSchedule(schedule);
    } else {
      setFilteredSchedule(
        schedule.filter((course) => course.status === filterOption)
      );
    }
  }, [schedule, filterOption]);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="extension-container bg-background font-figtree">
        <Header />
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <LoadingPage />
          ) : filteredSchedule.length === 0 ? (
            <EmptyPage />
          ) : (
            <>
              <CoursesFilter
                option={filterOption}
                setOption={setFilterOption}
              />
              <div className="grid grid-cols-2 gap-3">
                {filteredSchedule.map((course, i) => (
                  <CourseCard key={i} course={course} />
                ))}
              </div>
              <WorkloadOverview
                courses={filteredSchedule}
                academicTerm={academicTerm}
              />
              <ExportButton
                courses={filteredSchedule}
                academicTerm={academicTerm}
              />
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default App;
