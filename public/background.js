// @flow
import { SITES } from 'constants.js'

//What tab is currently active.
// LI: Is equivalent  to the current tab.
// When the current tab changes, currentTab has the old tab until tabs.onUpdated event handler runs completely
let currentTab = null;
chrome.tabs.onUpdated.addListener(
    (tabId, changeInfo, tab) => {
        alert("hello");
    }
);


/**
 * Get the entire list of Site objects from disk
 * @returns An array of all the stored Sites
 */
async function getBlockedSites() : ?Site[] {
    let sites;
    chrome.storage.local.get([SITES], store => { sites = store.sites; })
    return await sites;
}

/**
 * Get a Site from disk matching a given domain.
 * @returns The matching Site or null if the domain is not found
 */
function getSite(domain) : ?Site {
    const sites : ?Site[]  = getBlockedSites();
    if (sites != null)
        return sites.find( site => site.domain === domain);
    else return null;
}

/**
 * Store the Site in disk.
 * If a Site w/ same domain is found, replaces it.
 * @param site Site to put in storage
 */
function putSite(site: Site) : void {
    const sites : Site[] = getBlockedSites() || [];
    let replaceIndex : number = sites.length; //by default, if the Site is not already in the array, it is added to the end
    //change replaceIndex to the index of the existing Site if applicable
    if (sites) {
        const foundIndex : number = sites.findIndex( s => s.domain === site.domain);
        if (foundIndex !== -1)
            replaceIndex = foundIndex;
    }

    //Do the replacement and store the array.
    sites[replaceIndex] = site;
    chrome.storage.local.set({ SITES, sites });
}


//Blocked site class
//Contains identifying and timer information
class Site {
    domain: string; //e.g. google.com
    unblockRemainingTime: number;
    lockdownRemainingTime: number;
}

