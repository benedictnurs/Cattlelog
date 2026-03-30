import React from 'react';

import './popup.css';

type Course = {
  code: string;
  section: string;
  title: string;
  crn: string;
  units: number;
  instructor?: string;
  description?: string;
  prerequisites?: string;
  geCourses?: string;
  workloadUnits?: number;
  finalExam?: string;
  courseMaterials?: string;
  dropDate?: string;
  schedule?: string;
};

function App() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [expandedCourses, setExpandedCourses] = React.useState<Set<string>>(
    new Set(),
  );
  const [showCattlelogModal, setShowCattlelogModal] = React.useState(false);
  const [showCalendarModal, setShowCalendarModal] = React.useState(false);

  const toggleCourseDetails = (crn: string) => {
    setExpandedCourses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(crn)) {
        newSet.delete(crn);
      } else {
        newSet.add(crn);
      }
      return newSet;
    });
  };

  const handleExportToCalendar = () => {
    const csvContent = generateCSV();
    console.log('Generated CSV content:', csvContent);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'course_schedule.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowCalendarModal(true);
  };

  const generateCSV = () => {
    console.log('Starting CSV generation with courses:', JSON.stringify(courses, null, 2));
    const headers = 'Subject,Start Date,Start Time,End Date,End Time,Description,Location\n';
    
    // Helper function to escape CSV fields
    const escapeCSV = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    // Default dates for the quarter
    const defaultStartDate = new Date('2025-09-25');
    const defaultEndDate = new Date('2025-12-12');

    // Helper function to get all dates for a specific day of week between start and end dates
    const getDatesForDay = (startDate: Date, endDate: Date, dayOfWeek: number): Date[] => {
      const dates: Date[] = [];
      const currentDate = new Date(startDate);
      
      // Move to the first occurrence of the specified day
      while (currentDate.getDay() !== dayOfWeek) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Add dates for each week until end date
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7);
      }
      
      return dates;
    };

    // Map day letters to day numbers (0 = Sunday, 1 = Monday, etc.)
    const dayNumberMap: { [key: string]: number } = {
      'M': 1, // Monday
      'T': 2, // Tuesday
      'W': 3, // Wednesday
      'R': 4, // Thursday
      'F': 5  // Friday
    };

    const rows = courses.flatMap(course => {
      console.log('Processing course:', JSON.stringify(course, null, 2));
      if (!course.schedule) {
        console.log('No schedule found for course:', course.code);
        return [];
      }

      const schedule = course.schedule.split('\n');
      console.log('Schedule lines:', schedule);
      
      return schedule.flatMap(meeting => {
        console.log('Processing meeting:', meeting);
        // Parse meeting details
        const typeMatch = meeting.match(/^(Lecture|Discussion)/);
        if (!typeMatch) {
          console.log('No type match found in meeting:', meeting);
          return [];
        }

        const type = typeMatch[0];
        console.log('Type:', type);
        const timeMatch = meeting.match(/(\d{1,2}:\d{2} [AP]M) - (\d{1,2}:\d{2} [AP]M)/);
        if (!timeMatch) {
          console.log('No time match found in meeting:', meeting);
          return [];
        }

        const startTime = timeMatch[1];
        const endTime = timeMatch[2];
        console.log('Times:', { startTime, endTime });

        // Extract days and location
        const remainingText = meeting.slice(type.length + timeMatch[0].length);
        console.log('Remaining text:', remainingText);
        
        // More flexible day matching - look for any sequence of M,T,W,R,F
        const daysMatch = remainingText.match(/^([MTWRF]+)/);
        if (!daysMatch) {
          console.log('No days match found in remaining text:', remainingText);
          return [];
        }

        const days = daysMatch[1];
        const location = remainingText.slice(days.length).trim();
        console.log('Days and location:', { days, location });

        // Convert days to full names
        const dayMap: { [key: string]: string } = {
          'M': 'Monday',
          'T': 'Tuesday',
          'W': 'Wednesday',
          'R': 'Thursday',
          'F': 'Friday'
        };

        // Use default dates for all courses
        const startDate = defaultStartDate;
        const endDate = defaultEndDate;

        console.log('Using dates:', { startDate, endDate });

        // Format dates for CSV
        const formatDate = (date: Date) => {
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const day = date.getDate().toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        };

        // Create an event for each day of the week for each week
        const events = days.split('').flatMap(day => {
          const dayName = dayMap[day];
          const dayNumber = dayNumberMap[day];
          
          if (!dayName || dayNumber === undefined) {
            console.log('Invalid day found:', day);
            return [];
          }

          // Get all dates for this day of the week
          const dates = getDatesForDay(startDate, endDate, dayNumber);
          console.log(`Dates for ${dayName}:`, dates);

          // Create an event for each date
          return dates.map(date => {
            const event = [
              escapeCSV(`${course.code} ${course.section} - ${type}`),
              formatDate(date),
              startTime,
              formatDate(date), // Same date for start and end
              endTime,
              escapeCSV(`${course.title}\nInstructor: ${course.instructor || 'TBA'}\nDay: ${dayName}`),
              escapeCSV(location)
            ].join(',');
            console.log('Generated event:', event);
            return event;
          });
        });

        console.log('Generated events for meeting:', events);
        return events;
      });
    });

    const csvContent = headers + rows.join('\n');
    console.log('Final CSV content:', csvContent);
    return csvContent;
  };

  const handleExportToCattlelog = () => {
    setShowCattlelogModal(true);
  };

  const closeModal = () => {
    setShowCattlelogModal(false);
    setShowCalendarModal(false);
  };

  const handleCopyClick = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id! },
          func: () => {
            function parseCourseBlock(element: Element): Course {
              // Get the course title which contains code and section
              const titleElement = element.querySelector('.classTitle');
              const titleText = titleElement?.textContent || '';
              console.log('Found course title:', titleText);
              
              // More flexible title parsing
              const parts = titleText.split(' - ');
              let code = '',
                section = '',
                title = '';
              
              if (parts.length >= 2) {
                const codeSection = parts[0].trim();
                title = parts[1].trim();
                
                // Split code and section
                const codeSectionParts = codeSection.split(' ');
                if (codeSectionParts.length >= 2) {
                  code = codeSectionParts.slice(0, -1).join(' '); // Everything except last part
                  section = codeSectionParts[codeSectionParts.length - 1]; // Last part is section
                }
              }

              // Get CRN and Units
              const crnElement = element.querySelector('.left-side div:nth-child(3)');
              const crn = crnElement?.textContent?.replace('CRN:', '').trim() || '';

              const unitsElement = element.querySelector('.left-side div:nth-child(4)');
              const unitsText = unitsElement?.textContent?.replace('Units:', '').trim() || '';
              const units = parseInt(unitsText);

              // Get instructor
              const instructorElement = Array.from(
                element.querySelectorAll('.classDescription div'),
              ).find((div) => div.textContent?.includes('Instructor(s):'));
              let instructor = instructorElement?.textContent
                ?.replace('Instructor(s):', '')
                .trim();
              // Handle TBA case
              if (instructor === 'TBA') {
                instructor = 'TBA';
              }

              // Get description
              const descriptionElement = element.querySelector(
                '.classDescription div:nth-child(3)',
              );
              const description = descriptionElement?.textContent
                ?.replace('Description:', '')
                .trim();

              // Get prerequisites
              const prerequisitesElement =
                element.querySelector('.prerequisites');
              const prerequisites = prerequisitesElement?.textContent
                ?.replace('Prerequisites:', '')
                .trim();

              // Get GE courses
              const geElement = element.querySelector('.ge3');
              const geCourses = geElement?.textContent
                ?.replace('GE Courses:', '')
                .trim();

              // Get workload units
              const workloadElement = element.querySelector(
                '.classDescription div:nth-child(5)',
              );
              const workloadText = workloadElement?.textContent
                ?.replace('Workload Units:', '')
                .trim();
              const workloadUnits = workloadText
                ? parseInt(workloadText)
                : undefined;

              // Get final exam
              const finalExamElement = element.querySelector(
                '.classDescription div:nth-child(6)',
              );
              const finalExam = finalExamElement?.textContent
                ?.replace('Final Exam:', '')
                .trim();

              // Get course materials
              const materialsElement =
                element.querySelector('.course-materials');
              const courseMaterials = materialsElement?.textContent
                ?.replace('Course Materials:', '')
                .trim();

              // Get drop date
              const dropDateElement = element.querySelector(
                '.classDescription div:nth-child(8)',
              );
              const dropDate = dropDateElement?.textContent
                ?.replace('Course Drop Date:', '')
                .trim();

              // Get schedule
              const scheduleElements = element.querySelectorAll('.meeting');
              const schedule = Array.from(scheduleElements)
                .map((meeting) => {
                  const type =
                    meeting.querySelector('.smallTitle')?.textContent?.trim() ||
                    '';
                  const time =
                    meeting
                      .querySelector('div:nth-child(2)')
                      ?.textContent?.trim() || '';
                  const days =
                    meeting
                      .querySelector('div:nth-child(3)')
                      ?.textContent?.trim() || '';
                  const location =
                    meeting
                      .querySelector('div:nth-child(4)')
                      ?.textContent?.trim() || '';
                  return `${type}${time}${days}${location}`;
                })
                .join('\n');

              // Find the actual final exam date by looking through all description divs
              const descriptionDivs = Array.from(element.querySelectorAll('.classDescription div'));
              let actualFinalExam = '';
              for (const div of descriptionDivs) {
                const text = div.textContent?.trim() || '';
                if (text.startsWith('Final Exam:')) {
                  actualFinalExam = text.replace('Final Exam:', '').trim();
                  break;
                }
              }

              console.log('Parsed course data:', {
                code,
                section,
                title,
                crn,
                units,
                instructor,
                schedule,
                finalExam: actualFinalExam,
                dropDate
              });

              return {
                code,
                section,
                title,
                crn,
                units,
                instructor,
                description,
                prerequisites,
                geCourses,
                workloadUnits,
                finalExam: actualFinalExam,
                courseMaterials,
                dropDate,
                schedule,
              };
            }

            try {
              // Get all course blocks from the main schedule container only, excluding saved-for-later courses
              const mainContainer = document.querySelector('#MainContainer');
              const courseElements = mainContainer?.querySelectorAll(
                '.CourseItem:not(#SaveForLaterCoursesDisplayContainer .CourseItem)',
              ) || [];
              
              console.log('Found course elements:', courseElements.length);
              
              // Parse courses and filter out invalid ones
              const courses = Array.from(courseElements)
                .map(parseCourseBlock)
                .filter((course) => {
                  // Check if the course has a valid name (code, section, and title)
                  return (
                    course.code &&
                    course.section &&
                    course.title &&
                    course.code.length > 0 &&
                    course.section.length > 0 &&
                    course.title.length > 0
                  );
                });
              
              console.log('Parsed courses:', courses);
              return courses;
            } catch (e) {
              console.error('Error parsing courses:', e);
              throw new Error('Error parsing courses: ' + e);
            }
          },
        },
        (results) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
          }
          if (results && results[0] && results[0].result) {
            console.log('Received courses from page:', results[0].result);
            setCourses(results[0].result);
          }
        },
      );
    });
  };

  return (
    <div className="content">
      <div className="header">
        <img
          src="https://daviscattlelog.com/cory-logo.png"
          alt="Cattlelog Logo"
          className="logo"
        />
        <h1>Cattlelog Course Copier</h1>
      </div>
      <div className="button-container">
        <button onClick={handleCopyClick}>Load Courses</button>
        <div className="export-buttons">
          <button
            className={`export-button ${courses.length > 0 ? 'active' : 'disabled'}`}
            onClick={handleExportToCalendar}
            disabled={courses.length === 0}
          >
            Export to Calendar
          </button>
          <button
            className={`export-button ${courses.length > 0 ? 'active' : 'disabled'}`}
            onClick={handleExportToCattlelog}
            disabled={courses.length === 0}
          >
            Export to Cattlelog
          </button>
        </div>
      </div>

      {courses.length > 0 && (
        <div className="courses-list">
          {courses.map((course, index) => (
            <div key={index} className="course-card">
              <div className="course-header">
                <h3>
                  {course.code} - {course.section}
                </h3>
                <p className="course-title">{course.title}</p>
                <div className="course-details">
                  <span>CRN: {course.crn}</span>
                  <span>Units: {course.units}</span>
                  {course.instructor && (
                    <span>Instructor: {course.instructor}</span>
                  )}
                </div>
                <button
                  className="toggle-details"
                  onClick={() => toggleCourseDetails(course.crn)}
                >
                  {expandedCourses.has(course.crn)
                    ? 'Hide Details'
                    : 'Show Details'}
                </button>
              </div>

              {expandedCourses.has(course.crn) && (
                <div className="course-additional-details">
                  {course.schedule && <span>Schedule: {course.schedule}</span>}
                  {course.description && (
                    <p className="course-description">{course.description}</p>
                  )}
                  {course.prerequisites && (
                    <p className="course-prerequisites">
                      Prerequisites: {course.prerequisites}
                    </p>
                  )}
                  {course.geCourses && <span>GE: {course.geCourses}</span>}
                  {course.finalExam && <span>Final: {course.finalExam}</span>}
                  {course.dropDate && <span>Drop by: {course.dropDate}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCattlelogModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <h2>Coming Soon!</h2>
            <p>
              Export to Cattlelog is still in development. Send us an email to let us know that you want this feature and we'll bump it up in priority to make it for you faster!
            </p>
            <p>
              But for now, you can use export to calendar and the rest of the features at{' '}
              <a href="https://daviscattlelog.com" target="_blank" rel="noopener noreferrer">
                daviscattlelog.com
              </a>
            </p>
          </div>
        </div>
      )}

      {showCalendarModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <h2>Import Instructions</h2>
            <p>Your course schedule has been downloaded as a CSV file. To import it into Google Calendar:</p>
            <ol className="import-steps">
              <li>Open Google Calendar</li>
              <li>Click the ⚙️ (Settings) icon</li>
              <li>Select "Import & export"</li>
              <li>Click "Import"</li>
              <li>Choose the downloaded CSV file</li>
              <li>Select your calendar</li>
              <li>Click "Import"</li>
            </ol>
            <p className="note">Note: The schedule uses example dates. You may want to adjust the dates in the CSV file to match your actual quarter dates.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
