// @flow
import { SITES } from './constants';

/**
 * An enum that describes the state of the Site
 * Using flow syntax described in https://github.com/facebook/flow/issues/627#issuecomment-437007323
 */
export opaque type State = 'BLOCKED' | 'UNBLOCKED' | 'UNBLOCKED_INTERRUPT' | 'LOCKDOWN';
export const STATES = {
    BLOCKED : ('BLOCKED' : State),
    UNBLOCKED : ('UNBLOCKED' : State),
    UNBLOCKED_INTERRUPT : ('UNBLOCKED_INTERRUPT' : State),
    LOCKDOWN : ('LOCKDOWN' : State)
};


//Blocked site class
//Contains identifying and timer information
export default class Site {
    domain: string; //e.g. google.com

    // Remaining durations until disruptions will occur reminding the user that the unblock time is running out.
    // Ascending order, all positive
    // When the final time is popped, the site moves on to the blocked or lockdown state.
    timesUntilUnblockDisruptions: number[];

    // Remaining time until lockdown is complete. Unaffected by whether the site is opened.
    lockdownRemainingTime: number;

    // When the remaining ***time fields*** were last updated. Important for calculating the true time left
    lastTimeUpdate: Date;

    /**
     * Updates the internal timing system of the Site.
     * If wasActive is true, i.e. the site was active, the remaing times until unblock disruptions decrease
     * timesUntilUnblockDisruptions may be left with zeroes (but not negative values)
     * It is up to the caller to query the state of the Site and
     * then later pop these values after the user has passed the interruption.
     * This function also subtracts from the lockdown timer if applicable
     * @param wasActive Whether the Site was active just before calling the function.
     */
    update(wasActive: boolean) : void {
        // The time to subtract is calculated as the time since the last update, if applicable.
        const totalTimeToSubtract : number = this.lastTimeUpdate ? Date.now() - this.lastTimeUpdate : 0;

        // Subtract from the unblock interrupt times, if applicable.
        let unblockTimeSubtracted : number = 0;
        if (wasActive)
        {
            for (let i=0; i<this.timesUntilUnblockDisruptions.length; ++i)
            {
                const initial = this.timesUntilUnblockDisruptions[i];
                const subtracted = initial > totalTimeToSubtract ? totalTimeToSubtract : initial;

                this.timesUntilUnblockDisruptions[i] -= subtracted;

                unblockTimeSubtracted = Math.max(unblockTimeSubtracted, subtracted);
            }
        }

        // Use the remaining time differfence to subtract from the lockdown time.
        const lockdownSubtractTime = Math.min(totalTimeToSubtract - unblockTimeSubtracted, this.lockdownRemainingTime);
        if (this.lockdownRemainingTime > 0)
            this.lockdownRemainingTime -= lockdownSubtractTime;


        // Finally, update the last update time to now
        this.lastTimeUpdate = new Date();

    }

    /**
     * Calculates the current State based on internal timer data.
     */
    calculateCurrentState() : State {
        // The time since last update
        const delta : number = new Date() - this.lastTimeUpdate;

        const initialInterruptTime : number = (this.timesUntilUnblockDisruptions[0] - delta) || 0;
        const finalReblockTime : number = (this.timesUntilUnblockDisruptions[this.timesUntilUnblockDisruptions.length - 1] - delta) || 0;
        const lockdownTime : number = this.lockdownRemainingTime - delta || 0;

        if (finalReblockTime > 0) { //if still unlocked
            if (initialInterruptTime <= 0) //interrupt now?
                return STATES.UNBLOCKED_INTERRUPT;
            else
                return STATES.UNBLOCKED;
        }
        else if (lockdownTime > 0) //not unlocked; still in lockdown?
            return STATES.LOCKDOWN;
        else
            return STATES.BLOCKED; //default state
    }

    timeUntilNextEvent() : number {
        // The time since last update
        const delta : number = new Date() - this.lastTimeUpdate;

        //First, look for relock & disruption times
        if (this.timesUntilUnblockDisruptions)
        {
            //see if there are any **upcoming** (adjusted remaining time > 0) reblock/interrupt events.
            const time : ?number = this.timesUntilUnblockDisruptions.find( time => time - delta > 0);
            if (time) return time - delta;
        }

        //else look for lockdown end time
        else if (this.lockdownRemainingTime - delta > 0)
            return this.lockdownRemainingTime - delta;

        //default (no upcoming event)
        return 0;
    }
}




/**
 * Get the entire list of Site objects from disk
 * @returns A promise that returns to an array of all the stored Sites
 */
function getBlockedSites() : Promise<?Site[]> {
    return new Promise(
        resolve => {
            chrome.storage.local.get(SITES, store => resolve(store.sites));
        }
    );
}

/**
 * Get a Site from disk matching a given domain.
 * @returns A promise that will resolve to the matching Site or null if the domain is not found
 */
export function getSite(domain : string) : Promise<?Site> {
    return getBlockedSites().then(
        sites => sites != null ? sites.find(site => site.domain === domain) : null
    );
}

/**
 * Store the Site in disk.
 * If a Site w/ same domain is found, replaces it.
 * @param site Site to put in storage
 */
export async function putSite(site: Site) {
    const sites = await getBlockedSites() || [];
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
