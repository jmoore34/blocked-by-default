// What tab is currently active.
// LI: Is equivalent  to the current tab.
// When the current tab changes, currentTab has the old tab until tabs.onUpdated event handler runs completely
let currentTab = null;


// Whenever the URL changes (whether the users switches to a different tab or not),
// check whether it is a blacklisted URL. If so, see if it is currently blocked (default).
// If not blocked, subtract unblock left time
// If lockdown, subtract lockdown left time
chrome.tabs.onUpdated.addListener(
    (tabId, changeInfo, tab) => {
        alert("hello");
    }
);

