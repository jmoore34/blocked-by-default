// @flow
import { SITES } from 'constants'
import Site from 'Site';
//What tab is currently active.
// LI: Is equivalent  to the current tab.
// When the current tab changes, currentTab has the old tab until tabs.onUpdated event handler runs completely
let currentTab = null;
chrome.tabs.onUpdated.addListener(
    (tabId, changeInfo, tab) => {
        alert("hello");
    }
);


