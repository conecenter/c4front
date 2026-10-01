import React, { useContext, useEffect, useMemo } from "react";
import { ReactNode } from "react";
import { State, SWRConfig } from "swr";
import { RootBranchContext } from "../main/vdom-hooks";

type SwrCacheMap = Map<string, State<string>>

interface SwrCacheProvider {
	children: ReactNode
}

const LS_KEY = 'svg-cache';

// Shared data for this browser-page session. This Map is never passed directly to SWR.
let sessionCache = loadFromLocalStorage();

const isSvgElement: (res: [string, State<string>]) => boolean = (([url]) => url.endsWith(".svg"));

const mergeSvgCache = (newCache: SwrCacheMap) => {
    sessionCache = new Map([...sessionCache, ...newCache]);
}

function SwrCacheProvider({ children }: SwrCacheProvider) {
	const { isRoot } = useContext(RootBranchContext);

	const cacheMap = useMemo(() => new Map(sessionCache), []);

	const config = useMemo(() => ({
        provider: () => cacheMap,
        revalidateOnFocus: false,
        revalidateOnReconnect: false
    }), [cacheMap]);

	useEffect(() => {
        if (!isRoot) return;

        const handlePageHide = () => {
            mergeSvgCache(cacheMap);
            saveSvgCacheToStorage();
        };
        window.addEventListener("pagehide", handlePageHide);
        return () => {
			// Make new entries available to the next root provider without writing to localStorage on every navigation
            mergeSvgCache(cacheMap);
			window.removeEventListener("pagehide", handlePageHide);
        };
    }, [cacheMap, isRoot]);

	return (
		<SWRConfig value={config}>
			{children}
		</SWRConfig>
	);
}

function loadFromLocalStorage(): SwrCacheMap {
	try {
		const parsedCache = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
		return new Map(parsedCache);
	} catch (err) {
		console.warn('Failed to parse svg-cache from localStorage, using empty cache', err);
	}
	return new Map();
}

function saveSvgCacheToStorage() {
	try {
		localStorage.setItem(
			LS_KEY,
			JSON.stringify([...sessionCache].filter(isSvgElement))
		);
	} catch (err) {
		console.error("Failed to save SVG cache:", err);
	}
}

export { SwrCacheProvider }