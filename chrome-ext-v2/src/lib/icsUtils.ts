import { Course } from '@/popup/App';
import { ORGANIZATION, PRODUCT_NAME, QUARTER_DATES } from './constants';

// Downloads an ICS calendar file to the user's computer
export function downloadICS(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Creates an ICS calendar file with all course meetings and final exams
export function generateICS(
  courses: Course[],
  academicTerm: string | null
): string {
  let ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//${ORGANIZATION}//${PRODUCT_NAME}//EN\n`;

  for (const course of courses) {
    for (const meeting of course.meetings)
      ics += generateMeetingEvent(course, meeting, academicTerm);
    ics += generateFinalExam(course);
  }

  ics += 'END:VCALENDAR';
  return ics;
}

// Creates a recurring calendar event for a course meeting (lecture, lab, etc.)
function generateMeetingEvent(
  course: Course,
  meeting: any,
  academicTerm: string | null
): string {
  const icsWeekdays: Record<string, string> = {
    M: 'MO',
    T: 'TU',
    W: 'WE',
    R: 'TH',
    F: 'FR',
  };

  // Parse meeting time
  const [startTime, endTime] = meeting.time.split(' - ');
  const [startHour, startMin] = parseTime(startTime);
  const [endHour, endMin] = parseTime(endTime);

  // Get quarter instruction start and end dates
  let quarterStartDate: Date;
  let quarterEndDate: Date;
  if (academicTerm && academicTerm in QUARTER_DATES) {
    quarterStartDate = new Date(
      QUARTER_DATES[academicTerm as keyof typeof QUARTER_DATES].start +
        'T00:00:00'
    );
    quarterEndDate = new Date(
      QUARTER_DATES[academicTerm as keyof typeof QUARTER_DATES].end +
        'T23:59:59'
    );
  } else {
    quarterStartDate = new Date();
    quarterEndDate = new Date(course.finalExamDate);
    quarterEndDate.setDate(quarterEndDate.getDate() - 1);
    quarterEndDate.setHours(23, 59);
  }

  const startDT = getFirstOccurrence(quarterStartDate, meeting.days);
  startDT.setHours(startHour, startMin);

  const endDT = new Date(startDT);
  endDT.setHours(endHour, endMin);

  const meetingDays = meeting.days
    .split('')
    .map((day: string) => icsWeekdays[day]);

  const event =
    [
      'BEGIN:VEVENT',
      `UID:${course.crn}_${meeting.type}_${startDT.toISOString()}`,
      `DTSTART:${formatICSDate(startDT)}`,
      `DTEND:${formatICSDate(endDT)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${meetingDays.join(',')};UNTIL=${formatICSDate(quarterEndDate)}`,
      `SUMMARY:${course.shortTitle} - ${meeting.type}`,
      `DESCRIPTION:${course.fullTitle}\\nInstructor: ${course.instructor}\\nLocation: ${meeting.location}`,
      `LOCATION:${meeting.location}`,
      'END:VEVENT',
    ].join('\n') + '\n';

  return event;
}

// Creates a calendar event for a course's final exam
function generateFinalExam(course: Course): string {
  if (!course.finalExamDate) return '';
  const examStart = new Date(course.finalExamDate);
  const examEnd = new Date(examStart);
  examEnd.setHours(examEnd.getHours() + 2);

  const location = course.meetings.find(m => m.type.toLowerCase().includes('lecture'))?.location;

  const event =
    [
      'BEGIN:VEVENT',
      `UID:${course.crn}_Final_Exam_${examStart.toISOString()}`,
      `DTSTART:${formatICSDate(examStart)}`,
      `DTEND:${formatICSDate(examEnd)}`,
      `SUMMARY:${course.shortTitle} - Final Exam`,
      `DESCRIPTION:${course.fullTitle}\\nInstructor: ${course.instructor}\\nLocation: ${location}`,
      `LOCATION:${location}`,
      'END:VEVENT',
    ].join('\n') + '\n';

  return event;
}

// Converts time string (e.g., "2:30 PM") to 24-hour format [hour, minute]
function parseTime(timeStr: string): [number, number] {
  const [time, period] = timeStr.split(' ');
  let [hour, min] = time.split(':').map(Number);

  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  return [hour, min];
}

// Finds the first occurrence of meeting days starting from a given date
function getFirstOccurrence(startDate: Date, days: string): Date {
  const weekdays: Record<string, number> = { M: 1, T: 2, W: 3, R: 4, F: 5 };

  const current = new Date(startDate);

  while (true) {
    for (const day of days) {
      if (current.getDay() === weekdays[day]) {
        return current;
      }
    }
    current.setDate(current.getDate() + 1);
  }
}

// Formats a Date object into ICS format (YYYYMMDDTHHMMSSZ)
function formatICSDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`; // <- Local time
  // return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; // <- UTC time
}