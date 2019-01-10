// @flow
import type {State} from './Site';
import {getSite} from "./Site";

export function getDomain(url: string) : string {
    return new URL(url).hostname;
}

export async function getStateFromURL(url: string) : Promise<?State> {
    const domain : string = getDomain(url);
    getSite(domain).then( site => {
        if (site)
            return site.calculateCurrentState();
    });
}