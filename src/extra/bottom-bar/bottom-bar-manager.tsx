import React, { createContext, ReactNode, useMemo, useState } from "react";
import { HorizontalCaptionContext } from "../../main/vdom-hooks";
import { useAddEventListener } from "../custom-hooks";
import { useRegistry } from "../hooks/use-registry";
import { ALIGN_VALS, filterByAlign, sortByPriority } from "../aligned-bars-api";
import type { LayoutBarContext, LayoutItem } from "../aligned-bars-api";

const BottomBarContext = createContext<LayoutBarContext>({});
BottomBarContext.displayName = "BottomBarContext";


function BottomBarManager({ children }: { children?: ReactNode }) {
    const { register, unregister, items } = useRegistry<LayoutItem>();
    const contextValue = useMemo(() => ({ register, unregister }), [register, unregister]);

    const { setBottomBarElem, offset } = useSystemVkOffset();

    const sortedItems = sortByPriority(items);

    const getBottomBarElems = () => ALIGN_VALS.map((align) =>
        <div key={align} className={`${align}Align`}>
            {filterByAlign(sortedItems, align).map(i => i.render())}
        </div>
    );

    return (
        <BottomBarContext.Provider value={contextValue}>
            {children}
            {sortedItems.length > 0 &&
                <HorizontalCaptionContext.Provider value={true}>
                    <div
                        ref={setBottomBarElem}
                        className="bottomBar bottom-row"
                        style={{ bottom: `${offset}px` }}
                    >
                        {getBottomBarElems()}
                    </div>
                </HorizontalCaptionContext.Provider>}
        </BottomBarContext.Provider>
    );
}

const OFFSET_THRESHOLD = 50;

function useSystemVkOffset() {
    const [offset, setOffset] = useState(0);

    const [bottomBarElem, setBottomBarElem] = useState<HTMLDivElement | null>(null);
    const window = bottomBarElem?.ownerDocument.defaultView;
    const visualViewport = window?.visualViewport;

    useAddEventListener(visualViewport, 'resize', calcOffset);
    useAddEventListener(visualViewport, 'scroll', calcOffset);

    function calcOffset() {
        if (!visualViewport) return;
        const offset = Math.max(0, window.innerHeight - (visualViewport.offsetTop + visualViewport.height));
        if (offset > OFFSET_THRESHOLD) setOffset(offset);
        else setOffset(0);
    }

    return { setBottomBarElem, offset };
}

export { BottomBarManager, BottomBarContext }