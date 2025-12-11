import React, { useLayoutEffect, useRef, useState } from "react";
import { ReactNode } from "react";
import { clamp } from "../utils";
import useResizeObserver from "@react-hook/resize-observer";

const MIN_SCALE = 0.6;

const roundTo2 = (n: number) => Math.round(n * 100) / 100;

interface BreakpointPreviewProps {
    targetWidth: number,
    children: ReactNode
}

export function BreakpointPreview({ targetWidth, children }: BreakpointPreviewProps) {
    const [scale, setScale] = useState(1);
    const boxRef = useRef<HTMLDivElement | null>(null);

    const changeScale = (outerWidth?: number) => {
        if (outerWidth === undefined) return;
        const currScale = roundTo2(outerWidth / targetWidth);
        setScale(clamp(currScale, MIN_SCALE, 1));
    }

    useLayoutEffect(() => {
        changeScale(boxRef.current?.clientWidth);
    }, []);

    useResizeObserver(boxRef, (entry) => changeScale(entry.contentBoxSize[0]?.inlineSize));

    return (
        <div ref={boxRef}>
            <div className="breakpointPreview"  style={{ transform: `scale(${scale})`, width: `${targetWidth}px` }}>
                {children}
            </div>
        </div>
    );
}