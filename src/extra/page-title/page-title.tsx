import React, { createContext, ReactNode, useContext, useMemo } from "react";
import clsx from 'clsx';
import { ScrollInfoContext } from "../scroll-info-context";
import { HorizontalCaptionContext } from "../../main/vdom-hooks";
import { useRegistry } from "../hooks/use-registry";
import { PageTitleBlock } from "./page-title-block";
import { Align, ALIGN_VALS, filterByAlign, LayoutBarContext, LayoutItem, sortByPriority } from "../aligned-bars-api";
import { PAGE_TITLE_CLASS } from "../css-selectors";

const TitleBarContext = createContext<LayoutBarContext>({});
TitleBarContext.displayName = "TitleBarContext";


function PageTitle({ children }: { children?: ReactNode }) {
    const { register, unregister, items } = useRegistry<LayoutItem>();
    const contextValue = useMemo(() => ({ register, unregister }), [register, unregister]);

    const scrollPos = useContext(ScrollInfoContext);
    const className = clsx('topRow', PAGE_TITLE_CLASS, scrollPos.compactUiHeader && ' hideOnScroll');

    const sortedItems = sortByPriority(items);

    const getAlignedTitleBlocks = (align: Align) => {
        const alignedItems = filterByAlign(sortedItems, align);
        const jsx = alignedItems.length > 0 ? alignedItems.map(i => i.render()) : null;
        return jsx && <div key={align} className={`${align}Align pageTitleItem`}>{jsx}</div>;
    }

    return (
        <TitleBarContext.Provider value={contextValue}>
            {sortedItems.length > 0 &&
                <HorizontalCaptionContext.Provider value={true}>
                    <div className={className} data-path="page-title" >
                        {ALIGN_VALS.map(getAlignedTitleBlocks)}
                    </div>
                </HorizontalCaptionContext.Provider>}
            {children}
        </TitleBarContext.Provider>
    );
}

export { PageTitle, TitleBarContext, PageTitleBlock }