// @flow
import { SITES, URL_PARAM } from './constants'
import Site, {getSite, putSite, STATES} from './Site';
import type { State } from './Site';
import { getDomain, getStateFromURL } from './util';


//What domain is currently active.
// LI: Is equivalent  to the current domain.
// When the current domain changes, currentTab has the old domain until domains.onUpdated event handler runs completely
let currentDomain : ?string = null;

// On tab change:
chrome.tabs.onUpdated.addListener(
    (tabId, changeInfo, tab: chrome$Tab) => {
        //1. First, update the timers of the current tab, if applicable
        if (currentDomain)
        {
            getSite(currentDomain).then( currentSite => {
                if (currentSite)
                    currentSite.update(true);
            });
        }

        //2. Then, look at the new domain. If it is a blocked Site, assess its status and act accordingly.
        assessStatus(tab);
    }
);


/**
 * Called when a user navigates to a site, or the event timer runs to zero.
 * Assesses the state of the tab (which is assumed to be active, though it technically doesn't have to be),
 * and performs necessary actions such as redirecting the tab to the lock page if the state of the Site is locked,
 * creating a popup if the state is unlocked_interrupt, redirecting to the lock page if the state
 * is lockdown, or leaving the tab alone if the state is unlocked.
 * @param tab Which tab should be assessed and dealt with
 */
async function assessStatus(tab: chrome$Tab) {
    // Extract the Site from the Tab
    if (tab.url) {
        getStateFromURL(tab.url).then( state => { if (state) handleStatus(state, tab)});
    }

    /**
     *  Internal function: given a tab and a Status of its Site, redirect it as needed.
     *
     */
    function handleStatus(status: State, tab: chrome$Tab) {
        const blockUrl: URL = new URL(chrome.runtime.getURL("index.html"));
        switch (status) {
            case STATES.BLOCKED: //for blocked or lockdown pages, redirect to blockpage.
            case STATES.LOCKDOWN:
                blockUrl.searchParams.set(URL_PARAM, tab.url || "");
                if (tab.id) //error handling in case somehow null tab passed
                    chrome.tabs.update(tab.id, {url: blockUrl.toString()});
                break;
            case STATES.UNBLOCKED_INTERRUPT:
                //TODO: Create interrupt code.
                break;
        }
    }

}




