import React, { useLayoutEffect, useRef, useState } from "react";
import { ReactNode } from "react";
import { clamp } from "../utils";
import useResizeObserver from "@react-hook/resize-observer";
import { BreakpointsDisplay } from "./breakpoints-display";
import { MASONRY_BOX_CLASS } from "./masonry-layout";

const MIN_SCALE = 0.7;
const MAX_PREVIEW_WIDTH = 2000;

const roundTo2 = (n: number) => Math.trunc(n * 100) / 100;

interface BreakpointPreviewProps {
    breakpoints: { [P: string]: number },
    currentBp: string | null,
    children: ReactNode
}

export function BreakpointPreview({ breakpoints, currentBp, children }: BreakpointPreviewProps) {
    const boxRef = useRef<HTMLDivElement | null>(null);

    const [scale, setScale] = useState(1);
    const [activeBp, setActiveBp] = useState<string | null>(currentBp);

    const bp = activeBp ?? currentBp;
    
    const { minWidth, maxWidth } = getBpRange(breakpoints, bp);

    const changeScale = (outerWidth?: number) => {
        if (!outerWidth || !minWidth) return;
        const currScale = roundTo2(outerWidth / minWidth);
        setScale(clamp(currScale, MIN_SCALE, 1));
    }

    useLayoutEffect(() => {
        changeScale(boxRef.current?.clientWidth);
    }, [minWidth]);

    useResizeObserver(boxRef, (entry) => changeScale(entry.contentBoxSize[0]?.inlineSize));

    const frameStyle: React.CSSProperties = {
        transform: `scale(${scale})`,
        minWidth: `${minWidth}px`,
        maxWidth: `${maxWidth}px`
    };

    return (
        <div ref={boxRef} className={MASONRY_BOX_CLASS}>
            <BreakpointsDisplay
                breakpoints={breakpoints}
                currentBp={currentBp}
                onBreakpointChange={setActiveBp}
                scale={scale}
            />
            <div
                className="breakpointPreview" 
                style={frameStyle}
            >
                {children}
            </div>
        </div>
    );
}

function getBpRange(bps: { [P: string]: number }, bp: string | null) {
    if (!bp || bps[bp] === undefined) return {};
    const sortedBps = Object.entries(bps).sort((a, b) => a[1] - b[1]);
    const currInd = sortedBps.findIndex(entry => entry[0] === bp);
    const minWidth = bps[bp] + 1;
    const maxWidth = sortedBps[currInd + 1]?.[1] || MAX_PREVIEW_WIDTH;
    return { minWidth, maxWidth };
}