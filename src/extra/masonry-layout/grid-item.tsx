import React, { forwardRef, MutableRefObject, ReactNode, useEffect } from 'react';
import GridLayout from 'react-grid-layout';

interface GridItemWrapper {
    itemLayout: GridLayout.Layout,
    correctHeight: (elem: HTMLDivElement | null) => void,
    children?: ReactNode
}

const GridItemWrapper = forwardRef<HTMLDivElement, GridItemWrapper>(
    ({ itemLayout, correctHeight, children, ...props }, ref) => {
        const domRef = ref as MutableRefObject<HTMLDivElement | null>;

        useEffect(() => { correctHeight(domRef.current) });

        return children
            ? <div ref={ref} data-grid={itemLayout} {...props}>{children}</div>
            : null
    }
);

export { GridItemWrapper };