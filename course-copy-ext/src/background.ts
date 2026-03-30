chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: copyPageContent,
  });
});

function copyPageContent() {
  const bodyText = document.body.innerText;

  navigator.clipboard
    .writeText(bodyText)
    .then(() => {
      alert('Page content copied to clipboard!');
    })
    .catch((err) => {
      alert('Failed to copy: ' + err);
    });
}
