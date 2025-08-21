import React, { createContext, ReactNode, useCallback, useMemo, useState } from "react";
import { NoCaptionContext } from "../../main/vdom-hooks";

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
                <NoCaptionContext.Provider value={true}>
                    <div className="bottomBar bottom-row">
                        {getBottomBarElems()}
                    </div>
                </NoCaptionContext.Provider>}
        </BottomBarContext.Provider>
    );
}

export type { Align, Id, BottomBarItem }
export { BottomBarManager, BottomBarContext }