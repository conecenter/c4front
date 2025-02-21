import React, { createContext, ReactNode, useContext, useState } from "react";
import { createPortal } from "react-dom";

const BottomBarContext = createContext<HTMLElement | null>(null);
BottomBarContext.displayName = "BottomBarContext";

interface ComponentWithChildren {
    children: ReactNode
}

function BottomBarManager({ children }: ComponentWithChildren) {
    const [bottomBarRef, setBottomBarRef] = useState<HTMLElement | null>(null);
    return (
        <BottomBarContext.Provider value={bottomBarRef}>
            {children}
            <div ref={setBottomBarRef} className="bottomBar bottom-row" />
        </BottomBarContext.Provider>
    );
}

function BottomBarContent({ children }: ComponentWithChildren) {
    const bottomBarRef = useContext(BottomBarContext);
    return bottomBarRef && children ? createPortal(children, bottomBarRef) : null;
}

export { BottomBarManager, BottomBarContent }