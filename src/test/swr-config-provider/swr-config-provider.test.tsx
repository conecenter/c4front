import React, { PropsWithChildren, useEffect } from "react";
import { render } from "@testing-library/react";
import { State, useSWRConfig } from "swr";
import { SwrCacheProvider } from "../../extra/swr-config-provider";
import { RootBranchContext } from "../../main/vdom-hooks";

type SwrCacheMap = Map<string, State<string>>;

function RootProvider({ children }: PropsWithChildren<object>) {
    return (
        <RootBranchContext.Provider value={{ isRoot: true, branchKey: "test" }}>
            <SwrCacheProvider>{children}</SwrCacheProvider>
        </RootBranchContext.Provider>
    );
}

function CacheProbe({ onCache }: { onCache: (cache: SwrCacheMap) => void }) {
    const { cache } = useSWRConfig();

    useEffect(() => {
        onCache(cache as SwrCacheMap);
    }, [cache, onCache]);

    return null;
} 

describe("SwrCacheProvider", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("gives each mounted provider its own cache Map", () => {
        const caches: SwrCacheMap[] = [];
        const captureCache = (cache: SwrCacheMap) => caches.push(cache);

        render(
            <>
                <RootProvider>
                    <CacheProbe onCache={captureCache} />
                </RootProvider>
                <RootProvider>
                    <CacheProbe onCache={captureCache} />
                </RootProvider>
            </>
        );

        expect(caches).toHaveLength(2);
        expect(caches[0]).not.toBe(caches[1]);
    });

    it("makes an unmounted root cache available to the next root provider", () => {
        const url = "root-navigation-test.svg";
        const state = { data: "<svg>navigation</svg>" };
        let firstCache: SwrCacheMap | undefined;

        const firstRoot = render(
            <RootProvider>
                <CacheProbe onCache={cache => firstCache = cache} />
            </RootProvider>
        );

        firstCache!.set(url, state);
        firstRoot.unmount();

        let nextCache: SwrCacheMap | undefined;
        render(
            <RootProvider>
                <CacheProbe onCache={cache => nextCache = cache} />
            </RootProvider>
        );

        expect(nextCache!.get(url)).toEqual(state);
    });

    it("saves the active root cache to localStorage on pagehide", () => {
        const url = "pagehide-test.svg";
        const state = { data: "<svg>pagehide</svg>" };
        let cache: SwrCacheMap | undefined;

        render(
            <RootProvider>
                <CacheProbe onCache={value => cache = value} />
            </RootProvider>
        );

        cache!.set(url, state);
        window.dispatchEvent(new Event("pagehide"));

        const persistedCache = new Map<string, State<string>>(
            JSON.parse(localStorage.getItem("svg-cache") || "[]")
        );
        expect(persistedCache.get(url)).toEqual(state);
    });
});
