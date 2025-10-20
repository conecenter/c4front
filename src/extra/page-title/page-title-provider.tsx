import React, { createContext, ReactNode, useMemo } from "react";
import { useRegistry } from "../hooks/use-registry";
import { LayoutBarContext, LayoutItem } from "../aligned-bars-api";

const PageTitleContext = createContext<LayoutBarContext>({});
PageTitleContext.displayName = "PageTitleContext";

function PageTitleProvider({ children }: { children?: ReactNode }) {
    const { register, unregister, items } = useRegistry<LayoutItem>();
    const contextValue = useMemo(
        () => ({ register, unregister, items }),
        [register, unregister, items]
    );

    return (
        <PageTitleContext.Provider value={contextValue}>
            {children}
        </PageTitleContext.Provider>
    );
}

export { PageTitleProvider, PageTitleContext }