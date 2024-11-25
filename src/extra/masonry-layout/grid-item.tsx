import React, { forwardRef, MutableRefObject, ReactNode, useEffect } from 'react';

interface GridItemWrapper {
    correctHeight: (elem: HTMLDivElement | null) => void,
    children?: ReactNode
}

const GridItemWrapper = forwardRef<HTMLDivElement, GridItemWrapper>(
    ({ correctHeight, children, ...props }, ref) => {
        const domRef = ref as MutableRefObject<HTMLDivElement | null>;

        useEffect(() => { correctHeight(domRef.current) });

        return children
            ? <div ref={ref} {...props}>{children}</div>
            : null
    }
);

GridItemWrapper.displayName = 'GridItemWrapper';

export { GridItemWrapper };