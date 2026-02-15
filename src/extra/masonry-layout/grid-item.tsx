import React, { forwardRef, MutableRefObject, ReactNode, useLayoutEffect } from 'react';

const MIN_H_LINE_HEIGHT = 1;

interface GridItemWrapper {
    minH?: number | null,
    correctHeight: (elem: HTMLDivElement | null) => void,
    children?: ReactNode
}

const GridItemWrapper = forwardRef<HTMLDivElement, GridItemWrapper>(
    ({ minH, correctHeight, children, ...props }, ref) => {
        const domRef = ref as MutableRefObject<HTMLDivElement | null>;

        useLayoutEffect(() => {
            const raf = requestAnimationFrame(() => correctHeight(domRef.current));
            return () => cancelAnimationFrame(raf);
        }); 

        return children ? (
            <div ref={ref} {...props} >
                {children}
                {minH &&
                    <hr style={{ height: `${MIN_H_LINE_HEIGHT}px`, top: `${minH - MIN_H_LINE_HEIGHT}px` }} />}
            </div>
        ) : null
    }
);

GridItemWrapper.displayName = 'GridItemWrapper';

export { GridItemWrapper };