import React from "react";
import { ReactNode } from "react";
import { State, SWRConfig } from "swr";

type SwrCacheMap = Map<string, State<string>>

interface SwrCacheProvider {
	children: ReactNode
}

const LS_KEY = 'svg-cache';

const SWR_OPTIONS = {
	provider: cacheProvider,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
}

const SwrCacheProvider = ({ children }: SwrCacheProvider) => {
	console.log('RENDER SWR CACHE PROVIDER')
	return (
		<SWRConfig value={SWR_OPTIONS}>
			{children}
		</SWRConfig>
	)
};

let cacheMap: SwrCacheMap | null = null;

function cacheProvider() {
	if (!cacheMap) {
		cacheMap = loadFromLocalStorage();
		console.log('INIT CACHE:', cacheMap);
		window.addEventListener('pagehide', saveSvgCacheToStorage);
	}
	return cacheMap;
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

const isSvgElement: (res: [string, State<string>]) => boolean = (([url]) => url.endsWith(".svg"));

function saveSvgCacheToStorage() {
	if (!cacheMap) return;
	try {
		const newCache = JSON.stringify(Array.from(cacheMap.entries()).filter(isSvgElement));
		localStorage.setItem(LS_KEY, newCache);
	} catch (err) {
		console.error("Failed to save SVG cache:", err);
	}
}

export { SwrCacheProvider }