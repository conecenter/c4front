import React, { createContext, ReactNode, useContext, useMemo } from "react";
import clsx from 'clsx';
import { ScrollInfoContext } from "../scroll-info-context";
import { HorizontalCaptionContext } from "../../main/vdom-hooks";
import { useRegistry } from "../hooks/use-registry";
import { PageTitleBlock } from "./page-title-block";
import { Align, ALIGN_VALS, filterByAlign, LayoutBarContext, LayoutItem, sortByPriority } from "../aligned-bars-api";

const TitleBarContext = createContext<LayoutBarContext>({});
TitleBarContext.displayName = "TitleBarContext";


function PageTitle({ children }: { children?: ReactNode }) {
    const { register, unregister, items } = useRegistry<LayoutItem>();
    const contextValue = useMemo(() => ({ register, unregister }), [register, unregister]);

    const scrollPos = useContext(ScrollInfoContext);
    const className = clsx('topRow', 'pageTitle', scrollPos.compactUiHeader && ' hideOnScroll');

    const sortedItems = sortByPriority(items);

    const getAlignedTitleBlocks = (align: Align) => (
        <div key={align} className={`${align}Align pageTitleItem`}>
            {filterByAlign(sortedItems, align).map(i => i.render())}
        </div>
    );

    return (
        <TitleBarContext.Provider value={contextValue}>
            <HorizontalCaptionContext.Provider value={true}>
                <div className={className} data-path="page-title" >
                    {children}
                    {ALIGN_VALS.map(getAlignedTitleBlocks)}
                </div>
            </HorizontalCaptionContext.Provider>
        </TitleBarContext.Provider>
    );
}

export { PageTitle, TitleBarContext, PageTitleBlock }