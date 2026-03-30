async function cacheAllProfessors() {
  const response = await fetch('https://api.daviscattlelog.com/courses/all');
  const allCourses = await response.json();
  const allProfessors = Array.from(
    new Set(allCourses.flatMap((c: any) => c.professors))
  );

  const now = new Date();

  chrome.storage.local.set({
    allProfessors: allProfessors,
    allProfessorsTimestamp: now.getTime(),
  });
}

chrome.runtime.onInstalled.addListener(() => {
  cacheAllProfessors();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveSchedule') {
    chrome.storage.local.set({
      schedule: message.schedule,
      academicTerm: message.academicTerm,
    });
  }

  if (message.action === 'getSchedule') {
    chrome.storage.local.get(['schedule', 'academicTerm'], (result) => {
      sendResponse({
        schedule: result.schedule || [],
        academicTerm: result.academicTerm || null,
      });
    });
    return true;
  }

  if (message.action === 'saveFilterOption') {
    chrome.storage.local.set({ filterOption: message.filterOption });
  }

  if (message.action === 'getFilterOption') {
    chrome.storage.local.get('filterOption', (result) => {
      sendResponse(result.filterOption || 'registered');
    });
    return true;
  }

  if (message.action === 'fetchProfessors') {
    chrome.storage.local.get(
      ['allProfessors', 'allProfessorsTimestamp'],
      (result) => {
        const now = new Date();
        const cacheAge = now.getTime() - result.allProfessorsTimestamp;
        const cacheExpiry = 1000 * 60 * 60 * 24; // 24 hours

        if (cacheAge > cacheExpiry) {
          cacheAllProfessors();
        }

        sendResponse(result.allProfessors);
      }
    );
    return true;
  }
});
