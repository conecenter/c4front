import React, { ReactNode, useContext } from "react";
import clsx from 'clsx';
import { ScrollInfoContext } from "../scroll-info-context";
import { HorizontalCaptionContext } from "../../main/vdom-hooks";
import { PageTitleBlock } from "./page-title-block";
import { Align, ALIGN_VALS, filterByAlign, sortByPriority } from "../aligned-bars-api";
import { PAGE_TITLE_CLASS } from "../css-selectors";
import { PageTitleContext } from "./page-title-provider";

function PageTitle({ children }: { children?: ReactNode }) {
    const { items = [] } = useContext(PageTitleContext);

    const scrollPos = useContext(ScrollInfoContext);
    const className = clsx('topRow', PAGE_TITLE_CLASS, scrollPos.compactUiHeader && 'hideOnScroll');

    const sortedItems = sortByPriority(items);

    const getAlignedTitleBlocks = (align: Align) => {
        const alignedItems = filterByAlign(sortedItems, align);
        const jsx = alignedItems.length > 0 ? alignedItems.map(i => i.render()) : null;
        return jsx && <div key={align} className={`${align}Align pageTitleItem`}>{jsx}</div>;
    }

    return (
        <HorizontalCaptionContext.Provider value={true} >
            {sortedItems.length > 0 &&
                <div className={className} data-path="page-title" >
                    {ALIGN_VALS.map(getAlignedTitleBlocks)}
                </div>}
            {children}
        </HorizontalCaptionContext.Provider>
    );
}

export { PageTitle, PageTitleBlock }