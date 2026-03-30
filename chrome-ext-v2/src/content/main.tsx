import { TERM_CODES } from '@/lib/constants';
import { getProfessor } from '@/lib/courseUtils';

declare global {
  var minInstructorRating: number; // Default instructor rating filter
  var editedByExtIdentifier: string; // Identifier for elements edited by the extension
}

globalThis.minInstructorRating = 0;
globalThis.editedByExtIdentifier = 'edited-by-extension';

// Course extraction functions START here

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
        .results-title {
            width: 35% !important;
        }
        .results-instructor {
            width: 15% !important;
        }
    `;
  document.head.appendChild(style);
}

/**
 * Extracts the academic term from the URL parameters
 * Converts term code "202510" -> "fall_quarter_2025"
 * @returns The formatted academic term string or null if not found
 */
function extractAcademicTerm() {
  const urlParams = new URLSearchParams(window.location.search);
  const termCode = urlParams.get('termCode');

  if (!termCode) return null;

  const year = termCode?.slice(0, 4);
  const term = termCode?.slice(4);

  const academicTerm = TERM_CODES[term as keyof typeof TERM_CODES];

  if (!academicTerm) return null;

  return academicTerm + '_' + year;
}

/**
 * Extracts the short and full course titles from a course element
 * Parses "MGT 011A B02 - Elementary Accounting" into "MGT 011A B02" and "Elementary Accounting"
 * @param courseElement The DOM element containing the course title
 * @returns Object with shortTitle and fullTitle
 */
function extractTitles(courseElement: Element) {
  const titles = courseElement
    .getElementsByClassName('classTitle')[0]
    .textContent?.split(/-(.+)/);
  return {
    shortTitle: titles?.[0].trim(),
    fullTitle: titles?.[1].trim(),
  };
}

/**
 * Extracts specific data fields from a course element by searching for key-value pairs
 * Looks for patterns like "CRN: 12345" and extracts the value after the colon
 * @param courseElement The DOM element containing course information
 * @param queries Object mapping field names to search strings (e.g., {"crn": "CRN:"})
 * @returns Queries object with extracted values
 */
function extractFromCourse(
  courseElement: Element,
  queries: Record<string, string>
) {
  const extractedQueries: Record<string, string | null> = {};

  for (const [key, query] of Object.entries(queries)) {
    extractedQueries[key] = null;
    for (const child of courseElement.children) {
      const text = child.textContent?.trim();
      if (text?.includes(query))
        extractedQueries[key] = text.split(/:(.+)/)[1].trim();
    }
  }

  return extractedQueries;
}

/**
 * Extracts meeting information (time, days, location) from a course element
 * @param courseElement The DOM element containing meeting information
 * @returns Array of meeting objects with type, time, days, and location
 */
function extractMeetings(couseElement: Element) {
  const meetings = [];
  const meetingElements = couseElement.getElementsByClassName('meeting');

  for (const meetingElement of meetingElements) {
    const meeting: Record<string, string | null | undefined> = {
      type: meetingElement.getElementsByClassName('smallTitle')[0].textContent,
    };
    for (let i = 1; i < meetingElement.children.length; i++) {
      const text = meetingElement.children[i].textContent?.trim();
      if (i === 1) meeting['time'] = text;
      else if (i === 2) meeting['days'] = text;
      else if (i === 3) meeting['location'] = text;
    }
    meetings.push(meeting);
  }
  return meetings;
}

/**
 * Extracts all courses from the saved schedule and sends it to the background script to store
 */
function extractSchedule(container: Element) {
  const schedule = [];
  const courseItems = container.getElementsByClassName('CourseItem');

  for (const item of courseItems) {
    const { shortTitle, fullTitle } = extractTitles(item);
    const status = item
      .getElementsByClassName('statusIndicator')[0]
      .textContent?.toLowerCase()
      .trim();

    const { crn, units } = extractFromCourse(
      item.getElementsByClassName('left-side')[0],
      {
        crn: 'CRN:',
        units: 'Units:',
      }
    );

    const { instructor, description, finalExamDate, courseDropDate } =
      extractFromCourse(item.getElementsByClassName('classDescription')[0], {
        instructor: 'Instructor(s):',
        description: 'Description:',
        finalExamDate: 'Final Exam:',
        courseDropDate: 'Course Drop Date:',
      });

    const instructorObj = instructor ? getProfessor(instructor) : null;
    const instructorRating = instructorObj ? instructorObj.overall_rating : null;

    const meetings = extractMeetings(item);

    schedule.push({
      shortTitle: shortTitle,
      fullTitle: fullTitle,
      status: status,
      crn: crn,
      units: units,
      instructor: instructor,
      instructorRating: instructorRating,
      description: description,
      finalExamDate: finalExamDate,
      courseDropDate: courseDropDate,
      meetings: meetings,
    });
  }

  const academicTerm = extractAcademicTerm();
  chrome.runtime.sendMessage({
    action: 'saveSchedule',
    schedule: schedule,
    academicTerm: academicTerm,
  });
}

/**
 * Sets up a MutationObserver to monitor changes to the saved schedule container
 * Automatically extracts course data whenever the container content changes
 * This ensures course data is captured when users add/remove courses from their schedule
 */
function monitorScheduleContainer() {
  const container = document.getElementById(
    'SavedSchedulesListDisplayContainer'
  );

  if (!container) {
    console.log('No saved schedules container found');
    return;
  }

  const observer = new MutationObserver(() => extractSchedule(container));
  observer.observe(container, { childList: true, subtree: true });
}

// Course extraction functions END here

// Search results modification functions START here

/**
 * Filters course search results by instructor rating and updates the filter button text
 * Sets the global minimum rating threshold and refreshes the search results display
 * @param minRating The minimum instructor rating to filter by (0 = show all)
 */
function filterCoursesByInstructorRating(minRating: number) {
  const filterBtns = Array.from(
    document.getElementsByClassName('instructor-filter-btn')
  );

  filterBtns.forEach((btn) => {
    const span = btn.querySelector('span') as HTMLElement;
    if (minRating === 0) {
      span.textContent = 'Instructor w/ Rating';
    } else {
      span.textContent = `Instructor w/ ${minRating}/5+ Rating`;
    }
  });

  globalThis.minInstructorRating = minRating;
  modifySearchResults();
}

/**
 * Modifies the column headers in the course search results table
 * Adjusts title column width and replaces instructor column with a rating filter dropdown
 */
function modifyDataColumnHeaders() {
  const dataColumns = document.querySelectorAll(
    '.data-column.column-header.align-left'
  );
  const titleColumns = Array.from(dataColumns).filter(
    (column) => column.textContent === 'Title:'
  );
  const instructorColumns = Array.from(dataColumns).filter(
    (column) => column.textContent === 'Instructor(s):'
  );

  titleColumns.forEach(
    (column) => ((column as HTMLElement).style.width = '35%')
  );

  instructorColumns.forEach((column) => {
    const columnElement = column as HTMLElement;
    columnElement.innerHTML = `
            <div class="dropdown" style="display: inline-block;">
                <a class="dropdown-toggle" data-toggle="dropdown">
                    <button class="btn btn-mini white-on-navyblue instructor-filter-btn">
                        <span>Instructor w/ Rating</span>
                        &nbsp;<b class="caret"></b>
                    </button>
                </a>
                <ul class="dropdown-menu defaultcase pull-right">
                    <li><a href="#" data-min-rating="0">All Instructors</a></li>
                    <li><a href="#" data-min-rating="4">Only 4/5 and above</a></li>
                    <li><a href="#" data-min-rating="3">Only 3/5 and above</a></li>
                    <li><a href="#" data-min-rating="2">Only 2/5 and above</a></li>
                    <li><a href="#" data-min-rating="1">Only 1/5 and above</a></li>
                </ul>
            </div>
        `;

    const instructorFilters =
      columnElement.querySelectorAll('[data-min-rating]');
    instructorFilters.forEach((filter) =>
      filter.addEventListener('click', (e) => {
        const minRating = parseInt(
          (e.target as HTMLElement).getAttribute('data-min-rating')!
        );
        filterCoursesByInstructorRating(minRating);
      })
    );

    columnElement.style.width = '15%';
  });
}

/**
 * Makes the course title clickable and links to the course page on Cattlelog
 * @param fullTitleDiv The DOM element containing the course title
 * @param shortTitle The short course title (e.g., "MGT 011A B02")
 */
function modifyFullTitleDiv(fullTitleDiv: HTMLElement, shortTitle: string) {
  let [dept, classCode, secCode] = shortTitle.split(' ');
  if (classCode[0] === '0') classCode = classCode.slice(1);

  const courseId = `${dept}${classCode}`;
  const courseUrl = `https://daviscattlelog.com/course/${courseId}`;

  fullTitleDiv.style.textDecoration = 'underline dashed';
  fullTitleDiv.style.textUnderlineOffset = '4px';
  fullTitleDiv.style.cursor = 'pointer';
  fullTitleDiv.onclick = () => window.open(courseUrl!, '_blank');
  fullTitleDiv.title = 'View class on Cattlelog';

  fullTitleDiv.classList.add(globalThis.editedByExtIdentifier);
}

/**
 * Adds a rating next to each instructor and link to their page on Cattlelog
 * @param instructorDiv The DOM element containing the instructor name
 */
function modifyInstructorDiv(instructorDiv: Element) {
  const instructor = instructorDiv.textContent?.trim();

  if (instructor === '.. The Staff') return;

  const professor = getProfessor(instructor!);

  if (!professor) return;

  const rating = professor.overall_rating;
  const instructorUrl = `https://daviscattlelog.com/professor/${professor.slug}`;

  instructorDiv.innerHTML = `
        <p
        class="alert ${rating >= 4 ? 'alert-success' : rating < 3 ? 'alert-danger' : ''}"
        title="View instructor on Cattlelog"
        style="display:inline-block; text-decoration: underline dashed; text-underline-offset: 4px; cursor: pointer;"
        onclick="window.open('${instructorUrl}', '_blank')">
            ${instructor}: ${rating}/5
        </p>
    `;

  instructorDiv.classList.add(globalThis.editedByExtIdentifier);
}

/**
 * Checks if an instructor meets the minimum rating requirement for the current filter
 * @param instructorDiv The DOM element containing the instructor information
 * @returns True if the instructor meets the rating requirement, false otherwise
 */
function instructorMeetsRequirements(instructorDiv: Element) {
  if (globalThis.minInstructorRating === 0) return true;
  if (!instructorDiv.classList.contains(globalThis.editedByExtIdentifier))
    return false;

  const instructor = instructorDiv.textContent?.trim();
  const rating = parseFloat(instructor?.split(': ')[1].split('/')[0]!);

  return rating >= globalThis.minInstructorRating;
}

/**
 * Modifies all course search results
 * Makes course titles clickable, adds instructor ratings, and applies rating filters
 * Uses a class identifier to prevent duplicate modifications
 */
function modifySearchResults() {
  const searchResults = document.getElementsByClassName('course-container');

  for (const result of searchResults) {
    const shortTitle = result
      .getElementsByClassName('results-subj')[0]
      .textContent?.trim();
    const fullTitleDiv = result.getElementsByClassName(
      'results-title'
    )[0] as HTMLElement;
    const instructorDiv =
      result.getElementsByClassName('results-instructor')[0];

    if (!fullTitleDiv.classList.contains(globalThis.editedByExtIdentifier))
      modifyFullTitleDiv(fullTitleDiv, shortTitle!);

    if (!instructorDiv.classList.contains(globalThis.editedByExtIdentifier))
      modifyInstructorDiv(instructorDiv);

    if (!instructorMeetsRequirements(instructorDiv))
      result.classList.add('hide');
    else result.classList.remove('hide');
  }

  // Scroll down to render results if less than 5 are shown
  const shownResults = Array.from(searchResults).filter(
    (result) => !result.classList.contains('hide')
  );
  if (shownResults.length < 5) {
    setTimeout(() => window.scrollBy({ top: 10, behavior: 'smooth' }), 100);
  }
}

/**
 * Sets up MutationObservers to monitor changes to the course search results containers
 * Automatically applies clickable titles, instructor ratings, filters, when new results appear
 * Monitors 2 search result containers (courseResultsDiv and inlineCourseResultsDiv)
 */
function monitorSearchResults() {
  const searchResultsDiv = document.getElementById('courseResultsDiv');
  const inlineSearchResultsDiv = document.getElementById(
    'inlineCourseResultsDiv'
  );

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target = mutation.target as Element;
      if (['courseResultsDiv', 'inlineCourseResultsDiv'].includes(target.id)) {
        modifyDataColumnHeaders();
        modifySearchResults();
        return;
      }
    }
  });

  if (searchResultsDiv)
    observer.observe(searchResultsDiv, { childList: true, subtree: true });
  if (inlineSearchResultsDiv)
    observer.observe(inlineSearchResultsDiv, {
      childList: true,
      subtree: true,
    });
}

// Search results modification functions END here

injectStyles();
monitorScheduleContainer();
monitorSearchResults();
