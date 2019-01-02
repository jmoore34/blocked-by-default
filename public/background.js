// @flow
import { SITES } from 'constants'
import Site from 'Site';


//What domain is currently active.
// LI: Is equivalent  to the current domain.
// When the current domain changes, currentTab has the old domain until domains.onUpdated event handler runs completely
let currentDomain = null;

// On tab change:
chrome.tabs.onUpdated.addListener(
    (tabId, changeInfo, tab) => {
        alert("hello");
    }
);




