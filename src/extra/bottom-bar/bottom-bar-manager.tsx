import React, { createContext, ReactNode, useCallback, useMemo, useState } from "react";
import { HorizontalCaptionContext } from "../../main/vdom-hooks";
import { useAddEventListener } from "../custom-hooks";

const ALIGN_VALS = ['l', 'c', 'r'] as const;

type Align = 'l' | 'c' | 'r';
type Id = string;

interface BottomBarItem {
    id: Id,
    align: Align,
    priority: number,
    render: () => ReactNode
}

interface BottomBarContext {
    register?: (item: BottomBarItem) => void,
    unregister?: (item: BottomBarItem) => void
}

const BottomBarContext = createContext<BottomBarContext>({});
BottomBarContext.displayName = "BottomBarContext";


const sortDesc = (a: BottomBarItem, b: BottomBarItem) => b.priority - a.priority;

function BottomBarManager({ children }: { children?: ReactNode }) {
    const [registry, setRegistry]  = useState(new Map<Id, BottomBarItem>());

    const register = useCallback((item: BottomBarItem) => {
        setRegistry(prev => {
            const next = new Map(prev);
            next.set(item.id, item);
            return next;
        });
    }, []);

    const unregister = useCallback((item: BottomBarItem) => {
        setRegistry(prev => {
            const next = new Map(prev);
            next.delete(item.id);
            return next;
        });
    }, []);

    const contextValue = useMemo(() => ({ register, unregister }), [register, unregister]);

    const { setBottomBarElem, offset } = useSystemVkOffset();

    const items = Array.from(registry.values()).sort(sortDesc);

    const getFilteredJsx = (align: Align) => items
        .filter(i => i.align === align)
        .map(i => i.render());

    const getBottomBarElems = () => ALIGN_VALS.map(
        (align) => <div key={align} className={`${align}Align`}>{getFilteredJsx(align)}</div>
    );

    return (
        <BottomBarContext.Provider value={contextValue}>
            {children}
            {items.length > 0 &&
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

export type { Align, Id, BottomBarItem }
export { BottomBarManager, BottomBarContext }